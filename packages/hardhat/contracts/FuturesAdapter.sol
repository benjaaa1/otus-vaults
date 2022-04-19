//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

// Libraries
import './interfaces/IFuturesMarket.sol';

// Inherited
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FuturesAdapter 
 * @author Otus
 * @dev Provides helpful functions for the vault to integrate with Synthetix FuturesMarkets
 */

contract FuturesAdapter {

  ///////////////
  // Variables //
  ///////////////

  IFuturesMarket immutable internal futuresMarket; 
  IERC20 internal quoteAsset;
  IERC20 internal baseAsset;

/**
   * @dev Assign synthetix futures contracts
   * @param _futuresMarket Synthetix futures market address
 */
  constructor(
    address _futuresMarket
  ) {
    futuresMarket = IFuturesMarket(_futuresMarket);
  }

  /**
  * @dev
  * @param _quoteAsset Quote asset address
  * @param _baseAsset Base asset address
  */
  function baseInitialize (
    address _quoteAsset,
    address _baseAsset
  ) internal {
    if (address(quoteAsset) != address(0)) {
      quoteAsset.approve(address(futuresMarket), 0);
    }
    if (address(baseAsset) != address(0)) {
      baseAsset.approve(address(futuresMarket), 0);
    }

    quoteAsset = IERC20(_quoteAsset);
    baseAsset = IERC20(_baseAsset);

    // Do approvals
    quoteAsset.approve(address(futuresMarket), type(uint).max);
    baseAsset.approve(address(futuresMarket), type(uint).max);
  }

  // 1. Vault opens short sell position on ETH
  // 2. Transfers collateral determined by strategy details to OptionMarket
  // 3. Transfers collateral determined by strategy details taken into account OptionCollateral to Futures Market
  // 4. Keeper tracks prices and details set on strategies
  // 5. On conditions met open and close position || on end of round close positions

  ////////////////////////////
  // Futures Market Actions //
  ////////////////////////////

  ///////////////////////
  // Market Operations //
  ///////////////////////

  function _transferMargin(int marginDelta) external {
    futuresMarket.transferMargin(marginDelta); 
  }

  function _withdrawAllMargin() external {
    futuresMarket.withdrawAllMargin(); 
  }

  function _modifyPosition(int sizeDelta) external {
    futuresMarket.modifyPosition(sizeDelta); 
  }

  function _closePosition() external {
    futuresMarket.closePosition(); 
  }

  function _liquidatePosition() external {
    futuresMarket.liquidatePosition(address(this)); 
  }

  //////////////////////////////
  // Market Position Details  //
  //////////////////////////////

  function _positions() internal view returns (uint64 id, uint64 fundingIndex, uint128 margin, uint128 lastPrice, int128 size) {
    (id, fundingIndex, margin, lastPrice, size) = futuresMarket.positions(address(this)); 
  }

  function _profitLoss() internal view returns (int value, bool invalid) {
    (value, invalid) = futuresMarket.profitLoss(address(this)); 
  }

  function _remainingMargin() internal view returns (uint marginRemaining, bool invalid) {
    (marginRemaining, invalid) = futuresMarket.remainingMargin(address(this)); 
  }

  function _orderFee(int sizeDelta) internal view returns (uint fee, bool invalid) {
    (fee, invalid) = futuresMarket.orderFee(sizeDelta); 
  }
}
