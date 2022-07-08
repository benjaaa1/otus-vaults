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
import {DNOtusVault} from "../DNOtusVault.sol";
import {DNStrategyBase} from "./DNStrategyBase.sol";

contract DNStrategy is DNStrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  IERC20 public collateralAsset; 

  address public vault;

  DNOtusVault public dNOtusVault;
  
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

  constructor() DNStrategyBase() {}

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
    dNOtusVault = DNOtusVault(_vault); 
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
    (, , , , , , , bool roundInProgress,) = dNOtusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentStrategy = _currentStrategy;
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
  * @notice split the funds to short/spot
  * @dev the vault should pass in a strike id, and the strategy would verify if the strike is valid on-chain.
  * @return positionId
  */
  function doTrade(int fundingRate) external onlyVault returns (uint positionId) {
    uint minCollateralPercent = currentStrategy.minCollateralPercent; 
    uint allCapital = collateralAsset.balanceOf(address(vault));

    require(
      collateralAsset.transferFrom(address(vault), address(this), allCapital),
      "collateral transfer from vault failed"
    );

    if(_isPositiveFundingRate(fundingRate)) {

      (
        uint spotCapital, 
        uint perpCapital, 
        uint leverageSize
      ) = _getCollateral(minCollateralPercent, allCapital);

      _tradePositiveFundingRate(spotCapital, perpCapital, leverageSize);

    } else {

      (
        uint spotCapital, 
        uint perpCapital, 
        uint leverageSize
      ) = _getCollateral(minCollateralPercent, allCapital);

      _tradeNegativeFundingRate(spotCapital, perpCapital, leverageSize);

    }

  }

  /**
   * @dev perform the trade on rebalance of positive funding rate (shorts pay longs)
   * @param spotCapital strike detail
   * @param perpCapital target collateral amount
   * @param leverageSize target collateral amount
   */
  function _tradePositiveFundingRate(
    uint spotCapital, 
    uint perpCapital, 
    uint leverageSize
  ) internal {

    ExchangeParams memory exchangeParams = getExchangeParams(quoteKey, baseKey);

    (uint quoteSpent, uint baseReceived) = exchangeToExactBaseWithLimit(exchangeParams, quoteKey, baseKey, spotCapital, type(uint).max); 

    // require base is certain amount 

    // futures 
    _transferMargin(int(perpCapital)); 
    _modifyPosition(-int(leverageSize));

  }

  //   /** perform the trade on rebalance of positive funding rate (longs pay shorts)
  //  * @dev perform the trade
  //  * @param strike strike detail
  //  * @param maxPremium max premium willing to spend for this trade
  //  * @param lyraRewardRecipient address to receive lyra trading reward
  //  * @return positionId
  //  * @return premiumReceived
  //  */
  function _tradeNegativeFundingRate(
    uint spotCapital, 
    uint perpCapital, 
    uint leverageSize
  ) internal {

    ExchangeParams memory exchangeParams = getExchangeParams(quoteKey, baseKey);

    (uint quoteSpent, uint baseReceived) = exchangeToExactBaseWithLimit(exchangeParams, quoteKey, baseKey, spotCapital, type(uint).max); 

    // require base is certain amount 

    // futures 
    _transferMargin(int(perpCapital)); 
    _modifyPosition(int(leverageSize));
  }

  
  // /**
  //  * @dev convert premium in quote asset into collateral asset and send it back to the vault.
  //  */
  // function returnFundsAndClosePositions() external onlyVault {
  //   ExchangeRateParams memory exchangeParams = getExchangeParams();
  //   uint quoteBal = quoteAsset.balanceOf(address(this));

  //   if(hasBaseCollat) {
  //     // exchange quote asset to base asset, and send base asset back to vault
  //     uint baseBal = baseAsset.balanceOf(address(this));
  //     uint minQuoteExpected = quoteBal.divideDecimal(exchangeParams.spotPrice).multiplyDecimal(
  //       DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate
  //     );
  //     uint baseReceived = exchangeFromExactQuote(quoteBal, minQuoteExpected);
  //     require(baseAsset.transfer(address(vault), baseBal + baseReceived), "failed to return funds from strategy");
  //   }

  //   if(hasQuoteCollat) {
  //     // send quote balance directly
  //   }

  //   require(quoteAsset.transfer(address(vault), quoteBal), "failed to return funds from strategy");

  //   _clearAllFuturesPositions();
  // }

}
