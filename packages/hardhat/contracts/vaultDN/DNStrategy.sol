//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";

// Libraries
import '../../synthetix/SignedSafeDecimalMath.sol';
import '../../synthetix/SafeDecimalMath.sol';
import '../../synthetix/SignedSafeMath.sol';

// Vault 
import {Vault} from "../../libraries/Vault.sol";
import {OtusVault} from "../OtusVault.sol";
import {StrategyBase} from "./StrategyBase.sol";

contract DNStrategy is DNStrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  IERC20 public collateralAsset; 

  address public vault;

  OtusVault public otusVault;
  
  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /************************************************
   *  ADMIN
   ***********************************************/

  constructor(address _synthetixAdapter) DNStrategyBase(_synthetixAdapter) {}

  function initialize(
    address _owner, 
    address _vault, 
    address[] memory marketAddresses,
    StrategyDetail memory _currentStrategy
  ) external { 

    baseInitialize(
      _owner, 
      _vault,
      marketAddresses,
      _currentStrategy
    ); 

    vault = _vault;
    otusVault = OtusVault(_vault); 
    collateralAsset = IERC20(marketAddresses[0]);
  }

  /************************************************
  *  SETTERS
  ***********************************************/

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  * quoteAsset usually USD baseAsset usually ETH
  */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress,) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentStrategy = _currentStrategy;
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
  * @notice sell a fix aomunt of options and collect premium
  * @dev the vault should pass in a strike id, and the strategy would verify if the strike is valid on-chain.
  * @param currentStrikeStrategy lyra strikeId to trade
  * @return positionId
  * @return premiumReceived
  * @return capitalUsed
  */
  function doTrade(StrikeStrategyDetail memory currentStrikeStrategy) external onlyVault returns (
      uint positionId,
      uint premiumReceived,
      uint capitalUsed
    )
  {
    uint index = activeStrikeIds.length; 
    uint strikeId = currentStrikeStrategy.strikeId;
    uint size = currentStrikeStrategy.size;
    uint optionType = currentStrikeStrategy.optionType;
    require(
      validateTimeIntervalByOptionType(strikeId, optionType),
      "min time interval not passed for option type"
    );

    require(_isValidVolVariance(strikeId, currentStrikeStrategy), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike, currentStrikeStrategy), "invalid strike");

    if(_isLong(currentStrikeStrategy.optionType)) {
      uint maxPremium = _getPremiumLimit(strike, false, currentStrikeStrategy);

      require(
        collateralAsset.transferFrom(address(vault), address(this), maxPremium),
        "collateral transfer from vault failed"
      );

      (positionId, premiumReceived) = _buyStrike(strike, size, currentStrikeStrategy, index, maxPremium);

      capitalUsed = maxPremium; 
    } else {
      (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(strike, size, optionType);

      require(
        collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
        "collateral transfer from vault failed"
      );

      (positionId, premiumReceived) = _sellStrike(strike, size, setCollateralTo, currentStrikeStrategy, index);

      capitalUsed = collateralToAdd;
    }

    currentStrikeStrategies.push(StrikeStrategyDetail(
      currentStrikeStrategy.targetDelta,
      currentStrikeStrategy.maxDeltaGap,
      currentStrikeStrategy.minVol,
      currentStrikeStrategy.maxVol,
      currentStrikeStrategy.maxVolVariance,
      currentStrikeStrategy.optionType,
      currentStrikeStrategy.strikeId,
      currentStrikeStrategy.size
    ));
  }

  /**
   * @dev perform the trade
   * @param strike strike detail
   * @param _size target collateral amount
   * @param setCollateralTo target collateral amount
   * @param currentStrikeStrategy target collateral amount
   * @param strategyIndex target collateral amount
   * @return positionId
   * @return premiumReceived
   */
  function _sellStrike(
    Strike memory strike,
    uint _size, 
    uint setCollateralTo,
    StrikeStrategyDetail memory currentStrikeStrategy,
    uint strategyIndex
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    uint minExpectedPremium = _getPremiumLimit(strike, true, currentStrikeStrategy);
    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    // perform trade
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: optionType,
        amount: _size, // size should be different depending on strategy 
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType + 1;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  //   /**
  //  * @dev perform the trade
  //  * @param strike strike detail
  //  * @param maxPremium max premium willing to spend for this trade
  //  * @param lyraRewardRecipient address to receive lyra trading reward
  //  * @return positionId
  //  * @return premiumReceived
  //  */
  function _buyStrike(
    Strike memory strike,
    uint _size, 
    StrikeStrategyDetail memory currentStrikeStrategy,
    uint strategyIndex,
    uint maxPremium
  ) internal returns (uint, uint) {

    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    // perform trade to long
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: optionType,
        amount: _size,
        setCollateralTo: 0,
        minTotalCost: 0,
        maxTotalCost: maxPremium,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType + 1;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

    require(result.totalCost <= maxPremium, "premium too high");

    return (result.positionId, result.totalCost);
  }

}
