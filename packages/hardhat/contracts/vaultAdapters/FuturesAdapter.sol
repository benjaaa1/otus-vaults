//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

// Libraries
import "../interfaces/IFuturesMarket.sol";

// Inherited
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FuturesAdapter
 * @author Otus
 * @dev Provides helpful functions for the vault to integrate with Synthetix FuturesMarket / Perp V2
 */
contract FuturesAdapter {
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
  function futuresInitialize(address _futuresMarket) internal {
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

  /**
   * @notice Transfers to margin from deposits
   * @param marginDelta is the amount of funds transfering
   */
  function _transferMargin(int marginDelta) internal {
    futuresMarket.transferMargin(marginDelta);
  }

  /**
   * @notice Withdraws all margin from synthetix futures
   */
  function _withdrawAllMargin() internal {
    futuresMarket.withdrawAllMargin();
  }

  /**
   * @notice Modifies the margin size used
   * @param sizeDelta is the leverage size
   */
  function _modifyPosition(int sizeDelta) internal {
    futuresMarket.modifyPosition(sizeDelta);
  }

  /**
   * @notice Closes any futures positions
   */
  function _closePosition() internal {
    futuresMarket.closePosition();
  }

  /**
   * @notice Remaining margin available
   * @return marginRemaining
   * @return invalid
   */
  function _remainingMargin() internal view returns (uint marginRemaining, bool invalid) {
    (marginRemaining, invalid) = futuresMarket.remainingMargin(address(this));
  }
}
