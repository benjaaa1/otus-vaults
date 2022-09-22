//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../synthetix/SafeDecimalMath.sol";

import {IStrategy} from "../interfaces/IStrategy.sol";

import {BaseVault} from "../vault/BaseVault.sol";
import {Vault} from "../libraries/Vault.sol";

import {Strategy} from "./strategy/Strategy.sol";
import {StrategyBase} from "./strategy/StrategyBase.sol";

/**
 * @title OtusVault
 * @author Lyra
 * @dev - Allows for maintaining vault, hedge state for different assets
 */
contract OtusVault is BaseVault {
  using SafeMath for uint;
  using SafeDecimalMath for uint;

  /************************************************
   *  IMMUTABLES & CONSTANTS
   ***********************************************/
  address public strategy;
  address public keeper;

  string public vaultName;
  string public vaultDescription;

  uint128 public lastQueuedWithdrawAmount;

  IERC20 collateralAsset;

  // add details for for vault type ~
  bool public isPublic;

  struct ActiveTrade {
    uint optionType;
    uint strikeId;
    uint size;
    uint premium;
    uint positionId;
    uint expiry;
    uint strikePrice;
  }

  /************************************************
   *   HEDGE TRACKING
   ************************************************/

  uint[] public strikeIdsHedged; // [10, 12, 11];
  mapping(uint => uint) public hedgeAttemptsByStrikeId;
  mapping(uint => bool) public activeHedgeByStrikeId;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address strategy);

  event Trade(address indexed vault, ActiveTrade[] activeTrades, uint round);

  event PositionReduced(uint positionId, uint amount);

  event RoundStarted(uint16 roundId, uint104 lockAmount, uint boardId);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(address user, uint16 roundId, uint currentCollateral);

  event KeeperUpdated(address owner, address keeper);

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyKeeper() {
    require(msg.sender == keeper, "NOT_KEEPER");
    _;
  }

  /************************************************
   *  CONSTRUCTOR & INITIALIZATION
   ***********************************************/

  constructor(uint _roundDuration) BaseVault(_roundDuration) {}

  /**
   * @notice Initializes contract on clone
   * @dev Should only be called by owner and only once
   * @param _owner owner of vault
   * @param _vaultInfo basic vault information
   * @param _vaultParams vault share information
   * @param _strategy address of strategy
   * @param _keeper address of keeper
   */
  function initialize(
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    address _strategy,
    address _keeper
  ) external {
    vaultName = _vaultInfo.name;
    vaultDescription = _vaultInfo.description;
    isPublic = _vaultInfo.isPublic;

    strategy = _strategy;
    keeper = _keeper;

    collateralAsset = IERC20(_vaultParams.asset);
    collateralAsset.approve(_strategy, type(uint).max);

    baseInitialize(
      _owner,
      _vaultInfo.tokenName,
      _vaultInfo.tokenSymbol,
      _vaultInfo.performanceFee,
      _vaultInfo.managementFee,
      _vaultParams
    );
  }

  /************************************************
   *  SETTERS
   ***********************************************/

  /**
   * @notice Set and update keeper address
   * @param _keeper address of keeper
   */
  function setKeeper(address _keeper) public onlyOwner {
    keeper = _keeper;
    emit KeeperUpdated(msg.sender, _keeper);
  }

  /************************************************
   *  PUBLIC ACTIONS
   ***********************************************/

  /**
   * @notice  Closes the current round, enable user to deposit for the next round
   */
  function closeRound() external onlyOwner {
    uint104 lockAmount = vaultState.lockedAmount;
    vaultState.lastLockedAmount = lockAmount;
    vaultState.lockedAmountLeft = 0;
    vaultState.lockedAmount = 0;
    vaultState.nextRoundReadyTimestamp = block.timestamp + Vault.ROUND_DELAY;
    vaultState.roundInProgress = false;
    vaultState.tradesExecuted = false;

    // won't be able to close if positions are not settled
    IStrategy(strategy).returnFundsAndClearStrikes();

    _clearHedgeTracking();

    emit RoundClosed(vaultState.round, lockAmount);
  }

  /**
   * @notice clears hedge tracking at end of round
   */
  function _clearHedgeTracking() internal {
    // withdraw all margin from futures market
    for (uint i = 0; i < strikeIdsHedged.length; i++) {
      uint strikeIdHedged = strikeIdsHedged[i]; // [12, 123, 454, 11, 112]
      delete hedgeAttemptsByStrikeId[strikeIdHedged];
      delete activeHedgeByStrikeId[strikeIdHedged];
    }

    strikeIdsHedged = new uint[](0);
  }

  /**
   * @notice Start the next/new round
   * @param boardId set the boardId for next round
   */
  function startNextRound(uint boardId) external onlyOwner {
    //can't start next round before outstanding expired positions are settled.
    require(!vaultState.roundInProgress, "round opened");
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, "CD");
    require(address(strategy) != address(0), "Strategy not set");
    // allow for multiple boardId selection and mostly check expiry is within strategy range
    IStrategy(strategy).setBoard(boardId);

    (uint lockedBalance, uint queuedWithdrawAmount) = _rollToNextRound(uint(lastQueuedWithdrawAmount));

    vaultState.lockedAmount = uint104(lockedBalance);
    vaultState.lockedAmountLeft = lockedBalance;
    vaultState.roundInProgress = true;

    lastQueuedWithdrawAmount = uint128(queuedWithdrawAmount);

    _transferFundsToStrategy();

    emit RoundStarted(vaultState.round, uint104(lockedBalance), boardId);
  }

  function _transferFundsToStrategy() internal {
    StrategyBase.StrategyDetail memory strategyDetail = IStrategy(strategy).getVaultStrategy();

    uint quoteBal = collateralAsset.balanceOf(address(this));
    // 10k 20% reserve = 10k * (.2) == 2k
    uint hedgeFunds = quoteBal.multiplyDecimal(strategyDetail.hedgeReserve);
    uint tradeBalance = quoteBal - hedgeFunds;
    require(collateralAsset.transfer(address(strategy), tradeBalance), "collateral transfer to strategy failed");
    // refactor transfer to synthetix when a hedge is needed to be opened only
    IStrategy(strategy).transferToFuturesMarket(int(hedgeFunds));
  }

  /**
   * @notice Start the trade for the next/new round depending on strategy
   * @param _strikes selected strikes to trade
   * @return positionIds lyra position ids
   */
  function trade(StrategyBase.StrikeTrade[] memory _strikes) external onlyOwner returns (uint[] memory positionIds) {
    // can trade during round as long as lockedAmount is greater than 0
    // round should be opened
    require(vaultState.roundInProgress, "round not opened");
    // require(!vaultState.tradesExecuted, "trades executed for round");

    uint allCapitalUsed;
    uint positionId;
    uint premium;
    uint capitalUsed;
    uint len = _strikes.length;
    uint expiry;
    uint strikePrice;
    positionIds = new uint[](len);

    ActiveTrade[] memory activeTrades = new ActiveTrade[](len);

    for (uint i = 0; i < len; i++) {
      StrategyBase.StrikeTrade memory _trade = _strikes[i];
      (positionId, premium, capitalUsed, expiry, strikePrice) = IStrategy(strategy).doTrade(_trade);
      allCapitalUsed += capitalUsed; // substract on costs
      positionIds[i] = positionId;

      ActiveTrade memory activeTrade = ActiveTrade(
        _trade.optionType,
        _trade.strikeId,
        _trade.size,
        premium,
        positionId,
        expiry,
        strikePrice
      );
      activeTrades[i] = activeTrade;
    }

    // update the remaining locked amount -- lockedAmountLeft can be used for hedge
    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - allCapitalUsed;
    vaultState.tradesExecuted = true;

    emit Trade(address(this), activeTrades, vaultState.round);
  }

  /**
   * @notice Reduce position by keeper if position dangerous
   * @param positionId lyra position id
   * @param closeAmount total amount to reduce
   */
  function reducePosition(uint positionId, uint closeAmount) external onlyKeeper {
    IStrategy(strategy).reducePosition(positionId, closeAmount);

    emit PositionReduced(positionId, closeAmount);
  }

  /************************************************
   *  Hedge Actions - Synthetix Futures
   ***********************************************/

  /**
   * @notice Simple hedge based on pricing of base asset
   * @param size hedge by size
   * @param size hedge by strikeId
   */
  function simpleHedge(int size, uint strikeId) external onlyKeeper {
    require(vaultState.roundInProgress, "Round closed");
    require(activeHedgeByStrikeId[strikeId] == false, "Vault has active hedge for strike");

    IStrategy(strategy)._simpleHedge(size);
  }

  /**
   * @notice delta hedge based on strategy settings
   */
  function dynamicDeltaHedge(int deltaToHedge, uint strikeId) external onlyKeeper {
    require(vaultState.roundInProgress, "Round closed");
    require(activeHedgeByStrikeId[strikeId] == false, "Vault has hedge for option type");

    uint deltaHedgeAttempts = hedgeAttemptsByStrikeId[strikeId];

    IStrategy(strategy)._dynamicDeltaHedge(deltaToHedge, deltaHedgeAttempts);

    hedgeAttemptsByStrikeId[strikeId] = deltaHedgeAttempts + 1;
    activeHedgeByStrikeId[strikeId] = true;
  }

  /**
   * @notice delta hedge based on user set min. delta to hedge
   * @param deltaToHedge set by user to minimize delta exposure
   */
  function staticDeltaHedge(int deltaToHedge, uint strikeId) external onlyKeeper {
    require(vaultState.roundInProgress, "Round closed");
    require(activeHedgeByStrikeId[strikeId] == false, "Vault has active hedge for strike");

    IStrategy(strategy)._staticDeltaHedge(deltaToHedge);
  }

  /**
   * @notice Close hedge by strikeId
   * @param strikeId close hedge for strikeId
   */
  function closeHedgeByStrikeId(uint strikeId) external onlyKeeper {
    require(activeHedgeByStrikeId[strikeId], "Vault has no active hedge for option type");
    IStrategy(strategy)._closeHedge();
    delete activeHedgeByStrikeId[strikeId];

    for (uint i = 0; i < strikeIdsHedged.length; i++) {
      strikeIdsHedged[i] = 0; // clear strike for now
    }
  }
}
