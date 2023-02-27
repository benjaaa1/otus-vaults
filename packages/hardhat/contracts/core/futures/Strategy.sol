//SPDX-License-Identifier: ISC
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

// Libraries
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import {Vault} from "../../libraries/Vault.sol";
import "../../synthetix/SignedSafeDecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";
import "../../synthetix/SignedSafeMath.sol";

// Futures Adapter - snx or gmx in inherits BaseFuturesAdapter
import {SynthetixAdapter} from "./SynthetixAdapter.sol";
import {StrategyBase} from "../base/StrategyBase.sol";

/**
 * @title Strategy - Futures
 * @author Otus
 * @dev Executes futures strategy for vault based on strategy settings
 */
contract Strategy is SynthetixAdapter, StrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  // vault strategy settings - can be updated when round is closed
  StrategyDetail public currentStrategy;

  /************************************************
   *  EVENTS
   ***********************************************/

  event Trade(address indexed _strategy, FuturesTrade trade, uint premium, uint expiry, uint round);

  event StrategyUpdated(address vault, StrategyDetail updatedStrategy);

  /************************************************
   *  ERRORS
   ***********************************************/

  /// @notice market has to be allowed
  /// @param market: name of the market
  error MarketNotAllowed(bytes32 market);

  /************************************************
   *  ADMIN
   ***********************************************/

  /**
   * @notice set quote asset and controller
   * @param _quoteAsset susd - usdc
   * @param _otusController otus controller
   * @param _synthetix market
   */
  constructor(
    address _quoteAsset,
    address _otusController,
    bytes32[] memory _markets,
    address[] memory _synthetix
  ) SynthetixAdapter(_quoteAsset, _markets, _synthetix) StrategyBase(_otusController) {}

  /**
   * @notice Initializer strategy
   * @param _owner owner of strategy
   * @param _vault vault that owns strategy
   */
  function initialize(address _owner, address _vault) external {
    adapterInitialize(_vault);
    baseInitialize(_owner, _vault);
  }

  /************************************************
   *  STRATEGY SETTERS
   ***********************************************/

  /**
   * @notice Update the strategy for the new round
   * @param _currentStrategy vault strategy settings
   */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentStrategy = _currentStrategy;

    // after strategy is set need to update allowed markets :
    _setAllowedMarkets(currentStrategy.allowedMarkets);

    emit StrategyUpdated(address(otusVault), currentStrategy);
  }

  /******************************************************
   * VAULT ACTIONS
   *****************************************************/

  function trade(
    bytes calldata data,
    uint _round
  ) external onlyVault returns (uint allCapitalUsed) {
    FuturesTrade memory _trade = abi.decode(data, (FuturesTrade));

    /// @notice check if market is allowed
    if (allowedMarkets[_trade.market] == false) {
      revert MarketNotAllowed(_trade.market);
    }

    /// need to be able to do other validations here

    // check leverage is less than max leverage allowed

    // int currHedgedNetDelta = _getPositionDelta();

    // if (_trade.isIncrease == true) {
    //   increasePosition(_trade);
    // } else {
    //   // require(_trade.positionId != bytes32(0), "No key");
    //   // decreasePosition(_trade.positionId, _trade);
    // }

    // emit Trade(address(this), _round);

    // trade details needed to make trade
    // is limit order ?
    // is long ?
    // leverage ?
    // size
    // asset
    // expiration
    // acceptable price
    // increase or reduce
    // gmx
    // - createIncreasePosition
    // - createDecreasePosition
    // snx
    // - modifyPosition (doesn't support limit orders so may need to submit to a keeper kwenta or gelota self)
    // - executeTrade(Trade memory _trade)

    // emit Trade(address(this), _trade, _round);

    // _modifyPosition();
  }

  function close() external onlyVault {
    closePosition();
    // send funds back to vault
    uint quoteBal = quoteAsset.balanceOf(address(this));
    _trasferFundsToVault(quoteBal);
  }

  /**
   * @notice transfer from vault
   * @param _amount quote amount to transfer
   */
  function _trasferFromVault(uint _amount) internal override {
    require(
      quoteAsset.transferFrom(address(vault), address(this), _amount),
      "collateral transfer from vault failed"
    );
  }

  function _trasferFundsToVault(uint quoteBal) internal override {
    if (quoteBal > 0 && !quoteAsset.transfer(address(otusVault), quoteBal)) {
      revert QuoteTransferFailed(address(this), address(otusVault), quoteBal);
    }
    emit QuoteReturnedToLP(quoteBal);
  }
}
