//SPDX-License-Identifier: ISC
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Vault
import {OtusVault} from "../OtusVault.sol";

/**
 * @title BaseFuturesAdapter
 * @author Otus
 * @dev Base contract for managing access to futures functions from strategy.
 */
abstract contract BaseFuturesAdapter {
  enum OrderTypes {
    LIMIT,
    STOP,
    MARKET
  }

  // struct Trade {
  //   OrderTypes orderType;
  //   uint positionId;
  //   bool isIncrease; // should probably go by size delta
  //   uint price;
  //   bool isLong;
  //   uint leverage;
  //   int size;
  //   bytes32 market; // base asset
  // }

  struct FuturesTrade {
    OrderTypes orderType;
    uint positionId;
    // in the ui it'll show the current size starts at 0 increase or decrease
    int sizeDelta;
    uint targetPrice;
    bytes32 market;
  }

  // move this over to basefuturesadapter.sol
  struct StrategyDetail {
    // max leverage of strategy
    uint maxLeverage;
    // eth btc link
    bytes32[] allowedMarkets;
  }

  /************************************************
   *  CONSTANTS
   ***********************************************/
  /// @notice tracking code used when modifying positions
  bytes32 private constant TRACKING_CODE = "OTUS";

  // events
  event PositionIncrease(bytes32 key, uint amount);

  event PositionClose(bytes32 key, uint amount);

  event PositionDecrease(bytes32 key, uint amount);

  // errors
  error NotImplemented(address thrower);

  function increasePosition(FuturesTrade memory _trade) internal virtual {
    revert NotImplemented(address(this));
  }

  function decreasePosition(FuturesTrade memory _trade) internal virtual {
    revert NotImplemented(address(this));
  }

  function cancelPosition() internal virtual {
    revert NotImplemented(address(this));
  }

  function closePosition() internal virtual {
    revert NotImplemented(address(this));
  }
}
