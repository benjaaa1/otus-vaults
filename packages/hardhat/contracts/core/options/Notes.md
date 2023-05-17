# Strike Management during Round

1. positionIdByStrikeOption mapping(bytes32 => uint)

- Strategy.sol
  -- \_reducePosition
  -- \_sellStrike
  -- \_buyStrike

Used in all these methods to get positionId
from strike + optiontype keccak256(x)
-- \_reducePosition
--- not sure why it's used here when we use positionid
--- for everything else

-- \_sellStrike/\_buyStrike
--- currently makes sense here since we use it to grab an existing positionId
--- lyra updates collateral on optiontoke based on positionId

2. activeStrikeByPositionId mapping(uint => StrikeTrade)

- LyraAdapter.sol
  -- \_checkDeltaByPositionId
  -- \_reducePosition

Used in these methods to get StrikeTrade
-- \_checkDeltaByPositionId
--- Grabbing strikeId + optionType
-- \_reducePosition
--- uses optionType and sends entire object to \_getPremiumLimit
--- uses market / optionType / size

3. activeStrikeTradesByMarket mapping(bytes32 => StrikeTrade[])

- LyraAdapter.sol
  -- \_checkNetDelta
  --- checks by market, and all the strikes traded for it during round
  --- used to get the positionid

nonReentrant
--- need to review if nonReentrant is required

## Update active strike management to

mapping(bytes32 => StrikeTrade) public tradeByKey

?? mapping(uint => StrikeTrade) public tradeByPositionId

### Required

1. positionIdByStrikeOption (easy replace)
   1.a. \_reducePosition Use entire trade object here instead of just key to map
   1.b. \_sellStrike \_buyStrike

2. activeStrikeByPositionId
   2.a. \_checkDeltaByPositionId - use helper function get
   2.b.

3.

2) function \_tradeKey(strikeId, optionType) internal returns (bytes32) {} -
   2.a store trade? \_storeTrade
3) function \_getPositionIdByKey(bytes32 key) internal returns (uint) {}
   3.a. function \_getTradeByPoisitionId(uint \_positionId) internal returns (StrikeTrade) {}
4) function \_getTradeByKey(bytes32 key) internal returns (bytes32 market, uint optionType, uint strikeId, uint size, uint positionId) {}
5) function \_getTradeByMarketKey(bytes32 key) internal returns (StrikeTrade[]) {}

`struct StrikeTrade { bytes32 market; uint optionType; uint strikeId; uint size; uint positionId; }`

// big issues in \_addActiveStrike
// probably need a positionId array/to be able to delete later
// tradeByPositionId
// positionIds[]

```
function _addActiveTrade(StrikeTrade _newTrade, uint positionId) {
  // check if strike/trade
  (bool _isActive, StrikeTrade _activeTrade) = _isActiveStrike(positionId);
  if(_isActive) {
    // need to update size somewhere
    tradeByPositionId[_positionId] = _activeTrade; // update using storage
  } else {
    tradeByPositionId[_positionId] = _newTrade;
    positionIds.push(_positionId);
  }
}
```

```
function _isActiveStrike(uint _positionId) internal view returns (bool _isActive, StrikeTrade _trade) {
  _trade = _getTradeByPoisitionId(_positionId);
  if(_trade.positionId == 0) {
    _isActive = false;
  }
  return (_isActive, _trade)
}
```

```
function _getTradeByPoisitionId(uint _positionId) internal view returns (StrikeTrade _trade) {
  _trade = tradeByPositionId[_positionId];
}
```

```
function _getTradeByMarketKey(bytes32 key) internal view returns (StrikeTrade[] memory _strikeTrades) {
  for(uint i = 0; i < positionIds.lenght; i++) {
    StrikeTrade memory _trade = _getTradeByPoisitionId(_positionId);
    if(_trade.market == key) {
      _strikeTrades.push(_trade);
    }
  }
}
```

## Managing Hedge Orders

1. User Hedge
   -- Allowed 1 user hedge / market
   -- User views/calculates delta by market
   -- Sets size (int) to hedge

```
mapping(bytes32 => UserHedge) public userHedges;

struct UserHedge {
  uint targetPrice;
  int sizeDelta;
  bool isActive;
  bytes32 market;
}

event UserHedge(bytes32 _market, uint sizeDelta)

// can be modifyUserHedge
// _size delta should always be updating the existing size hedge

// user can decide he wants to hedge 10 eth or 20 eth
// this only adds to whatever existing hedge
// in ui show existing hedge size (slider)
// send difference in _sizeDelta
// if existing is 0
// user wants to hedge by longig +10 _sizeDelta

function _openUserHedge(bytes32 _market, int _hedgeSize) internal {
  int currHedgedNetDelta = _getPositionDelta();

  IFuturesMarket futuresMarket = IFuturesMarket(_market);

  int modifiedPositionAmount = _hedgeSize - currHedgedNetDelta;
  uint targetLeverage // get this from strategy?

  if (modifiedPositionAmount < 0) {
    notional = -SafeCast.toInt256(Math.abs(modifiedPositionAmount).multiplyDecimal(targetLeverage));
  } else {
    notional = SafeCast.toInt256(Math.abs(modifiedPositionAmount).multiplyDecimal(targetLeverage));
  }

  (uint feeDollars, ) = futuresMarket.orderFee(notional);
  uint spot = _getPrice();

  UserHedge storage _userHedge = userHedges[_market];

  uint requiredMargin = Math.abs(_hedgeSize).multiplyDecimal(spot).divideDecimal(targetLeverage) + feeDollars;

  // two cases either we increase the delta exposure or decrease and need to refund quote
  if (Math.abs(_hedgeSize) >= Math.abs(currHedgedNetDelta)) {
      if (requiredMargin > curMargin) {
        liquidityPool.transferQuoteToHedge(requiredMargin - curMargin);
        futuresMarket.transferMargin(SafeCast.toInt256(requiredMargin - curMargin));
      }

      // modify position
      futuresMarket.modifyPosition(modifiedPositionAmount);
  } else if (expectedHedge == 0) {

  } else {
    // remove margin
  }

  if(_userHedge.isActive) {
    // this means we are adding/removing to existing position
    // get position size
    (, , uint128 curMargin, , ) IFuturesMarket.positions(address(this));
    //
  } else {

  }
}

function _closeUserHedge(bytes32 _market) public {
    IFuturesMarket futuresMarket = IFuturesMarket(_market);

      futuresMarket.closePosition();
      futuresMarket.withdrawAllMargin();

      // send funds to strategy or vault?
}

function _getPositionDelta() internal pure returns (int) {
  (, , , , int128 size) = futuresMarket.positions(address(this));
  return size;
}

```

2. dynamic hedge
   -- set at beginning of round
   -- places order to geltao
   -- store (hedgeorderid)

-- gelato cheker
-- LyraAdapter.sol
-- function checker(hedgeorderid)
--- checks if delta threshold (validDynamicHedgeOrder)
--- check commited margin is there enough still?

--- execute order
--- on snx get order details
--- similar process to userhedge

--- end of round need

Strategy.sol

LyraAdapter.sol

SynthetixHedgeExtension.sol

GMXHedgeExtension.sol

3. Limit order
   // user opens trade
   // Strike Trade (isLimitOrder = true)
   // priceTarget
   // if limit order == true
   // - placeOrder(StrikeTrade) // ? should it have expires?
   // - checker should validate
   // then use internal \_executeOrder executeOrder for only keeper
   // remove from limit order mapping

// going to leave dynamic hedge for v2 + aave vaults + uniswap

/\***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\***

- Hedge Keeper Checks - Extension \***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\***/

// places order
// if delta is +.8
// size is 10
// and max delta is .6
// trigger hedge at .7
// and min delta is -.6
// trigger hedge at -.7

// so should be 1 hedge strategy order
// hedge checker will need to
// check current delta
// compare against hedge strategy
// if outisde delta boundaries
// execute trade

// on next block checker will check again
// check hedge strategy check current delta (view)
// if within boundaries (check activehedgeorders)
// if one exists dont create another

// single HedgeActiveOrder / round

//

V1 Options (1 week)

- Arbitrum
  - Using USDC
  - User Hedging through GMX
  - Limit Orders in Gelato
- Optimism

  - Using sUSD
  - User Hedging through Synthetix
  - Limit Orders in Gelato

- Update Scripts

  - Registry
  - Create

- UI Updates
  - Support Limit Orders (Only single trade allowed / UI limitation)
  - User Hedging by Market

V1 Futures (1 week)

- After GMX User Hedging
  - Implement Futures Vault for Arbitrum Vault
  - Implement Synthetix Limit Orders (Gelato / Perps v2)

V2 Multichain Deposits

- Using socket support chains
  - BSC
  - Polygon

V2 Options (1 week)

- Dynamic Hedging (Using Gelato)

  - GMX
  - Synthetix

- Users should be able to deposit from any chain supported to a vault on a different chain

V2 Aave Extension

- For Aave extension vault may need to support ETH + some other token deposits
  - Users deposit ETH
  - Manager borrows USD
    -- Hedges
    -- Buys/Sells Options

V2 Uniswap/Pancake Swap integration

- Single token represents

V2 Voting for certain strategy updates

V3 Vault Token Liquidity

- Exit for a fee and someone else wanting in P2P swap

V3 Blur Integration

- Vault for floor purchases

V3 Trade Reveal

- Reveal trade only to whitelisted users
- Prevents front running
- Manager signs trade with key
- Reveals trade only to users

## 24kb limit

- MOve

## Synthetix Hedge Extension needs to be moved out and not handle state

## handle state through strategy.sol and base

# Branches for different Chains

- Arbitrum - Alcmene
- Base - Bacchus
- Optimism - Orion

# Deployment

## Arbitrum - Alcmene

Otus Governance Controls:

OtusController

- lyra markets bytes32 (eth/btc)
- LyraBase contract addresses
  OtusCloneFactory
- otusVault, otusController addresses
  LyraBase (Deploy First)
- marketKey, exchangeAdapter, optionToken, liquidityPool, shortCollateral... lyraaddresses

Immutable Implementation Contracts:

OtusVault

- otusController address

Strategy(Options)

- usdc (quoteasset address) / otusController (address)
  GMXHedgeExtension
  BaseHedgeExtension

Strategy(Futures)
GMXAdapter
BaseFuturesAdapter

BaseStrategy

## Base - Bacchus

Otus Governance Controls:

OtusController
OtusCloneFactory
LyraBase

Immutable Implementation Contracts:

OtusVault

Strategy(Lending)
AaveExtension

Strategy(Swap)
SushiSwapExtension

BaseStrategy

## Optimism - Orion

Otus Governance Controls:

OtusController
OtusCloneFactory
LyraBase

Immutable Implementation Contracts:

OtusVault
Strategy(Options)
SynthetixHedgeExtension
BaseHedgeExtension

Strategy(Futures)
SynthetixAdapter
BaseFuturesAdapter

Strategy(Swap)
SushiSwapExtension

Strategy(Lending)
AaveExtension

BaseStrategy

# Vision

Managers can create a basket of strategies(options,futures)/assets(nfts,tokens,other), these will be represented by a token which represents the basked for a set time period by the manager. This allows investors to be exposed to different strategies/assets for a time with a simple token, that investors can enter and exit as they wish.

A token can have 1 to many strategies, if the tokens value is

Multi Strategy

OtusVault

trade (bytes32 strategyType, bytes calldata_data)

- need to grab strategy address from strategyType

execute

- need to grab strategy address from strategyType

# Limit Order Contracts for Calculator

contract LyraAccountOrder is OpsReady, OwnableUpgradeable {

// quote-asset

// immutable lyra contract addresses

enum OrderTypes {
MARKET,
LIMIT
}

struct StrikeTrade {
bytes32 market;
uint optionType;
uint strikeId;
uint size;
uint positionId;
uint targetPrice;
// supports limit orders
OrderTypes orderType;
}

struct StrikeTradeOrder {
StrikeTrade strikeTrade;
bytes32 gelatoTaskId;
}

constructor() {
// set lyra contracts
}

init() initializer() {}

function deposit() {}

function withdraw() {}

// can deposit at the same time if funds not available
function placeOrder(StrikeTrade memory \_trade) {
// check ethers size
// long vs short

    // islong
    // capital needed
    // is short
    // collateral required

    // check account balance (quoteAsset)
    // if less < => transfromUser

    // create task

    // add to orders
    //

}

function placeLimitOrder() {}

function placeStopLimitOrder() {

}

function checker() {}

function validOrder() {}

function executeOrder() {}

function cancelOrder() {}

// deposit calls this
function \_trasferFromUser(uint \_amount) internal override {
require(
quoteAsset.transferFrom(address(vault), address(this), \_amount),
"collateral transfer from vault failed"
);
}

// withdraw calls this
function \_trasferFundsToUser(uint \_quoteBal) internal override {
if (\_quoteBal > 0 && !quoteAsset.transfer(address(otusVault), \_quoteBal)) {
revert QuoteTransferFailed(address(this), address(otusVault), \_quoteBal);
}
emit QuoteReturnedToLP(\_quoteBal);
}

}
