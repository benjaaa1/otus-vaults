//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

// Libraries
import '../interfaces/IFuturesMarket.sol';

// Inherited
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ExchangeAdapter 
 * @author Otus
 * @dev Provides helpful functions for the vault to integrate with Synthetix Exchange
 */

contract ExchangeAdapter {

  ///////////////
  // Variables //
  ///////////////

  IFuturesMarket internal futuresMarket; 

  /**
  * @dev Assign synthetix futures contracts
  */
  constructor() {}

  /**
  * @dev
  * @param _futuresMarket futures market address
  */
  function futuresInitialize (address _futuresMarket) internal {
    futuresMarket = IFuturesMarket(_futuresMarket);
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

  function _transferMargin(int marginDelta) internal {
    futuresMarket.transferMargin(marginDelta); 
  }

  function _withdrawAllMargin() internal {
    futuresMarket.withdrawAllMargin(); 
  }

  function _modifyPosition(int sizeDelta) internal {
    futuresMarket.modifyPosition(sizeDelta); 
  }

  function _closePosition() internal {
    futuresMarket.closePosition(); 
  }

  function _liquidatePosition() internal {
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
