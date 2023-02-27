//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

// Gelato keeper utils
import "../utils/OpsReady.sol";

abstract contract BaseHedgeExtension is OpsReady {
  enum HEDGETYPE {
    NO_HEDGE,
    USER_HEDGE,
    DYNAMIC_DELTA_HEDGE
  }

  // hedge type strategy for vault (none, user, dynamic)
  HEDGETYPE public hedgeType;

  struct UserHedgeStrategy {
    // max market leverage
    uint targetLeverage;
  }

  struct DynamicHedgeStrategy {
    uint targetLeverage;
  }

  struct Hedge {
    // eth / btc
    bytes32 marketKey;
    uint marginDelta;
    int sizeDelta;
    //
    uint targetPrice;
    bytes32 gelatoTaskId;
    // used for sythetix futures
    uint maxDynamicFee;
    HEDGETYPE hedgeType;
  }

  struct HedgeOrder {
    Hedge hedge;
    bytes32 gelatoTaskId;
  }

  /************************************************
   *  STATE - Hedge Strategy
   ***********************************************/

  UserHedgeStrategy public userHedgeStrategy;

  DynamicHedgeStrategy public dynamicHedgeStrategy;

  // set by strategy and total funds
  uint public committedHedgeMargin;
  /************************************************
   *  STATE - Hedge orders
   ***********************************************/

  mapping(uint => Hedge) public hedges;

  uint public hedgeOrderId;

  mapping(uint => HedgeOrder) public hedgeOrders;

  /************************************************
   *  EVENTS
   ***********************************************/

  event HedgeClose(HEDGETYPE _hedgeType);

  event HedgeOpen(HEDGETYPE _hedgeType, int size, uint spotPrice);

  event StrategyHedgeTypeUpdated(address vault, HEDGETYPE hedgeType);

  event DynamicHedgeStrategyUpdated(address vault, DynamicHedgeStrategy dynamicStrategy);

  /************************************************
   *  ERRORS
   ***********************************************/
  error NotImplemented(address thrower);

  /************************************************
   *  SET HEDGE
   ***********************************************/

  /************************************************
   *  USER HEDGES
   ***********************************************/

  // -> openUserHedge has checks
  // -> can only be called once (must close previous one)
  // -> synthetix
  // -> modify position
  // -> gmx
  // -> create increase position (market)
  // -> sets size delta
  // -> calls openUserHedge(uint _size)
  function _openUserHedge(bytes32 _market, int _hedgeSize) internal virtual {
    revert NotImplemented(address(this));
  }

  // close position
  // closeUserHedge

  function _closeUserHedge(bytes32 _market) internal virtual {
    revert NotImplemented(address(this));
  }

  /************************************************
   *  DYNAMIC HEDGE
   ***********************************************/

  // called at beginning of trade for each market
  // - only if dynamic hedge
  // - only if strategy settings have been set
  // sets gelato order for cheker
  function createDynamicHedge() internal virtual {
    revert NotImplemented(address(this));
  }

  // checker hedge has to call some lyra base stuff
  // can add this to lyraadapter
  function hedgeChecker(uint256 _hedgeOrderId) external virtual {
    revert NotImplemented(address(this));
  }

  // can add this to lyraadapter to have access to lyra delta checks
  function validDynamicHedgeOrder(uint256 _hedgeOrderId) internal virtual {
    revert NotImplemented(address(this));
  }

  // should be on the
  function executeDynamicHedgeOrder(uint256 _hedgeOrderId) external virtual {
    revert NotImplemented(address(this));
  }

  // called at end of round
  function closeDynamicHedge() external virtual {
    revert NotImplemented(address(this));
  }

  function closePosition() internal virtual {
    revert NotImplemented(address(this));
  }
}
