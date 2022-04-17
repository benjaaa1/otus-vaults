//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Hardhat
import "hardhat/console.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {VaultAdapter} from '@lyrafinance/core/contracts/periphery/VaultAdapter.sol';
import {DecimalMath} from "@lyrafinance/core/contracts/synthetix/DecimalMath.sol";
import './interfaces/IFuturesMarket.sol';

// Libraries
import './synthetix/SignedSafeDecimalMath.sol';
import './synthetix/SafeDecimalMath.sol';

// Vault 
import {Vault} from "./libraries/Vault.sol";
import {OtusVault} from "./OtusVault.sol";
import {OtusAdapter} from "./OtusAdapter.sol";
import {OtusAdapterManager} from "./OtusAdapterManager.sol";

contract Strategy is OwnableUpgradeable {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  uint public activeExpiry;
  
  uint[] public activeStrikeIds;
  mapping(uint => uint) public strikeToPositionId;
  mapping(uint => uint) public lastTradeTimestamp;

  address public keeper; 
  address public vault;
  address public futuresMarket;

  OtusVault public otusVault;
  OtusAdapter public adapter; 
  
  IERC20 public quoteAsset;
  IERC20 public baseAsset;

  VaultAdapter.OptionType public tradeOptionType;
  address public immutable otusAdapterManager; 
  IERC20 public collateralAsset;

  uint public currentStrikePrice;

  // strategies can be updated by different strategizers
  struct Detail {
    uint collatBuffer; // multiple of vaultAdapter.minCollateral(): 1.1 -> 110% * minCollat
    uint collatPercent; // partial collateral: 0.9 -> 90% * fullCollat
    uint minTimeToExpiry;
    uint maxTimeToExpiry;
    int targetDelta;
    uint maxDeltaGap;
    uint minVol;
    uint maxVol;
    uint size;
    uint minTradeInterval;
    uint maxVolVariance;
    uint gwavPeriod;
  }

  struct HedgeDetail {
    uint hedgePercentage; // 20% + collatPercent == 100%
    uint maxHedgeAttempts; // 
    uint limitStrikePricePercent; // ex. strike price of 3100 2% ~ 3030
    uint leverageSize; // 150% ~ 1.5x 200% 2x 
    uint stopLossLimit; 
  }

  Detail public currentStrategy;
  HedgeDetail public currentHedgeStrategy;

  /************************************************
   *  EVENTS
   ***********************************************/

  event KeeperUpdated(address keeper);

  event HedgeClosePosition(address closer);

  event HedgeModifyPosition(address closer, uint marginDelta, uint256 hedgeAttempt);


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

  constructor(address _otusAdapterManager) {
    otusAdapterManager = _otusAdapterManager;
  }

  function initialize(
    address _vault, 
    address _owner, 
    address _quoteAsset, 
    address _baseAsset,
    address _adapter
  ) external initializer {
    __Ownable_init();
    transferOwnership(_owner);
    vault = _vault;
    otusVault = OtusVault(_vault); 
    futuresMarket = otusVault.futuresMarket(); // future kwenta adapter --> otusAdapter
    
    adapter = OtusAdapter(_adapter);

    quoteAsset = IERC20(_quoteAsset); 
    baseAsset = IERC20(_baseAsset); 

    quoteAsset.approve(address(vault), type(uint).max);
    baseAsset.approve(address(vault), type(uint).max);
  }

  /************************************************
  *  SETTERS
  ***********************************************/

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  * quoteAsset usually USD baseAsset usually ETH
  */
  function setStrategy(
      Detail memory _strategy, 
      HedgeDetail memory _hedgeStrategy,
      uint _tradeOptionType
    ) external onlyOwner {
    (, , , , , , , bool roundInProgress) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    
    currentStrategy = _strategy;
    currentHedgeStrategy = _hedgeStrategy;

    tradeOptionType = VaultAdapter.OptionType(_tradeOptionType); 
    collateralAsset = adapter._isBaseCollat(tradeOptionType) ? baseAsset : quoteAsset;
  }

  /************************************************
  *  VAULT ACTIONS
  ***********************************************/
   
  /**
  * @dev set the board id that will be traded for the next round
  */
  function setBoard(uint boardId) public onlyVault {
    activeExpiry = adapter.setBoard(boardId, currentStrategy);
  }

  /**
   * @dev convert premium into quote asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    VaultAdapter.ExchangeRateParams memory exchangeParams = adapter._getExchangeParams();
    uint quoteBal = quoteAsset.balanceOf(address(this));

    uint quoteReceived = 0;
    if (adapter._isBaseCollat(tradeOptionType)) {
      // todo: double check this
      uint baseBal = baseAsset.balanceOf(address(this));
      uint minQuoteExpected = baseBal.multiplyDecimal(exchangeParams.spotPrice).multiplyDecimal(
        DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate
      );
      quoteReceived = adapter._exchangeFromExactBase(baseBal, minQuoteExpected);
    }
    require(quoteAsset.transfer(address(vault), quoteBal + quoteReceived), "failed to return funds from strategy");

    _clearAllActiveStrikes();
  }

  /**
  * @notice request trade detail according to the strategy. 
  */
  function startTradeForRound(uint strikeId, uint collateral) 
    external onlyVault returns (
      uint positionId,
      uint premiumReceived,
      uint collateralToAdd
    ) {

    // validate trade
    require(
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp,
      "min time interval not passed"
    );
    require(adapter._isValidVolVariance(strikeId, currentStrategy.maxVolVariance, currentStrategy.gwavPeriod), "vol variance exceeded");

    VaultAdapter.Strike memory strike = adapter._getStrikes(_toDynamic(strikeId))[0];
    require(adapter.isValidStrike(strike, currentStrategy, activeExpiry, tradeOptionType), "invalid strike");

    uint currentPositionId = strikeToPositionId[strike.id]; 
    uint setCollateralTo; 
    (collateralToAdd, setCollateralTo) = getRequiredCollateral(strike, currentPositionId);

    require(
      collateralAsset.transferFrom(address(vault), address(adapter), collateralToAdd),
      "collateral transfer from vault failed"
    );

    // multiply setCollateralTo
    (positionId, premiumReceived) = sellStrike(strike, setCollateralTo);
    
    // set strike 
    currentStrikePrice = strike.strikePrice; 

    // uint256 hedgeCollateral = collateral.sub(collateral.multiplyDecimal(currentHedgeStrategy.hedgePercentage / 100));
    // IFuturesMarket(futuresMarket).transferMargin(int256(hedgeCollateral));

  }

  /**
   * @dev perform the trade
   * @param strike strike detail
   * @param setCollateralTo target collateral amount
   * @return positionId
   * @return premiumReceived
   */
  function sellStrike(
    VaultAdapter.Strike memory strike,
    uint setCollateralTo
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    uint minExpectedPremium = adapter._getPremiumLimit(
      strike, 
      true, 
      currentStrategy,
      tradeOptionType
    );

    // before trade is performed send collateral needed to adapter
    // bring back when trade is complete 
    // and then all the way back to vault

    // perform trade  
    VaultAdapter.TradeResult memory result = adapter._openPosition(
      VaultAdapter.TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: tradeOptionType,
        amount: currentStrategy.size,
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: otusVault.supervisor() // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId);

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  /**
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   */
  function reducePosition(uint positionId) external onlyVault {
    VaultAdapter.OptionPosition memory position = adapter._getPositions(_toDynamic(positionId))[0];
    VaultAdapter.Strike memory strike = adapter._getStrikes(_toDynamic(position.strikeId))[0];
    VaultAdapter.ExchangeRateParams memory exchangeParams = adapter._getExchangeParams();

    require(strikeToPositionId[position.strikeId] != positionId, "invalid positionId");

    // only allows closing if collat < minBuffer
    uint minCollatPerAmount = adapter._getBufferCollateral(
      tradeOptionType,
      strike.strikePrice, 
      strike.expiry, 
      exchangeParams.spotPrice, 
      1e18,
      currentStrategy.collatBuffer
    );
    require(
      position.collateral < minCollatPerAmount.multiplyDecimal(position.amount),
      "position properly collateralized"
    );

    // closes excess position with premium balance
    uint closeAmount = position.amount - position.collateral.divideDecimal(minCollatPerAmount);
    uint maxExpectedPremium = adapter._getPremiumLimit(strike, false, currentStrategy, tradeOptionType);
    VaultAdapter.TradeResult memory result = adapter._closePosition(
      VaultAdapter.TradeInputParameters({
        strikeId: position.strikeId,
        positionId: position.positionId,
        iterations: 3,
        optionType: tradeOptionType,
        amount: closeAmount,
        setCollateralTo: position.collateral,
        minTotalCost: type(uint).min,
        maxTotalCost: maxExpectedPremium,
        rewardRecipient: otusVault.supervisor() // set to zero address if don't want to wait for whitelist
      })
    );

    require(result.totalCost <= maxExpectedPremium, "premium paid is above max expected premium");

    // return closed collateral amount
    if (adapter._isBaseCollat(tradeOptionType)) {
      uint currentBal = baseAsset.balanceOf(address(this));
      baseAsset.transfer(address(vault), currentBal);
    } else {
      // quote collateral
      quoteAsset.transfer(address(vault), closeAmount);
    }
  }

  function getRequiredCollateral(
    VaultAdapter.Strike memory strike, 
    uint positionId
  ) public view returns (uint collateraToAdd, uint setCollateralTo) {
    bool isActiveStrike = _isActiveStrike(strike.id); 
    (collateraToAdd, setCollateralTo) = adapter._getRequiredCollateral(
      tradeOptionType,
      strike,
      currentStrategy,
      positionId,
      isActiveStrike
    );
  }

  /************************************************
   *  KEEPER ACTIONS - KWENTA HEDGE
   ***********************************************/

  /**
   * @dev this should be executed after the vault execute trade on OptionMarket and by keeper
   */
  function _openKwentaPosition(uint hedgeAttempts) public onlyVault returns (bool activeShort) {
    require(currentHedgeStrategy.maxHedgeAttempts <= hedgeAttempts); 
    require(!activeShort, "Active futures hedge");
    // uint marginDelta; // 1 - (collateral * .85) * leverage required uint "-" is for shorts
    uint marginDelta = calculateHedgePositionSize();
    IFuturesMarket(futuresMarket).modifyPosition(int(marginDelta));
    hedgeAttempts += 1; 
    activeShort = true; 
    emit HedgeModifyPosition(msg.sender, marginDelta, hedgeAttempts);
  }

  /**
  * @dev called by keeper 
  * update vault collateral, call 
  */
  function _closeKwentaPosition() public onlyVault returns (bool activeShort) {
    require(activeShort, "No current position");
    IFuturesMarket(futuresMarket).closePosition();
    activeShort = false; 
    // transfer all funds back to vault state
    emit HedgeClosePosition(msg.sender);
  }

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  */
  function calculateReducePositionPrice() internal view returns (uint strikeLimitPrice) {
    strikeLimitPrice = currentHedgeStrategy.limitStrikePricePercent.multiplyDecimal(currentStrikePrice);
  }

  function calculateHedgePositionSize() internal view returns (uint totalHedgeSizeAfterFees) {
    // for now we do a full hedge
    uint hedgeCollat = adapter._getFullCollateral(tradeOptionType, currentStrikePrice, currentStrategy.size)
      .multiplyDecimal(1 - currentStrategy.collatPercent).multiplyDecimal(currentHedgeStrategy.leverageSize);

    (uint fee, ) = IFuturesMarket(futuresMarket).orderFee(int(hedgeCollat));

    totalHedgeSizeAfterFees = hedgeCollat - fee; 
  }

	/************************************************
   *  ACTIVE STRIKE MANAGEMENT
   ***********************************************/
  /**
   * @dev add strike id to activeStrikeIds array
   */
  function _addActiveStrike(
			uint strikeId, 
			uint tradedPositionId
		) internal {
    if (!_isActiveStrike(strikeId)) {
      strikeToPositionId[strikeId] = tradedPositionId;
      activeStrikeIds.push(strikeId);
    }
  }

  /**
   * @dev remove position data opened in the current round.
   * this can only be called after the position is settled by lyra
	 * probably should be on strategy *****
   **/
  function _clearAllActiveStrikes() internal {
    if (activeStrikeIds.length != 0) {

      uint[] memory positionIds; 

      for (uint i = 0; i < activeStrikeIds.length; i++) {
        uint strikeId = activeStrikeIds[i];
        uint positionId = strikeToPositionId[strikeId]; 
        positionIds[i] = positionId; 
      }

      VaultAdapter.OptionPosition[] memory positions = adapter._getPositions(positionIds); 

      uint positionIdsLen = positions.length; 
      VaultAdapter.OptionPosition memory position;
      for(uint i = 0; i < positionIdsLen; i++) {
        position = positions[i];
        require(position.state != VaultAdapter.PositionState.ACTIVE, "cannot clear active position");
        delete strikeToPositionId[position.strikeId];
        delete lastTradeTimestamp[i];
      }
      delete activeStrikeIds;
    }
  }

  function _isActiveStrike(uint strikeId) internal view returns (bool isActive) {
    isActive = strikeToPositionId[strikeId] != 0;
  }

  function _toDynamic(uint val) internal pure returns (uint[] memory dynamicArray) {
    dynamicArray = new uint[](1);
    dynamicArray[0] = val;
  }
}
