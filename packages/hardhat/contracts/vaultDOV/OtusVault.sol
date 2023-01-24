//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import 'hardhat/console.sol';

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../synthetix/SafeDecimalMath.sol';

import {IStrategy} from '../interfaces/IStrategy.sol';

import {BaseVault} from '../vault/BaseVault.sol';
import {Vault} from '../libraries/Vault.sol';

import {Strategy} from './strategy/Strategy.sol';
import {StrategyBase} from './strategy/StrategyBase.sol';

/**
 * @title OtusVault
 * @author Lyra
 * @dev - Allows for maintaining vault, hedge state for different assets
 */
contract OtusVault is BaseVault {
  using SafeMath for uint;
  using SafeDecimalMath for uint;

  /************************************************
   *  STATE
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
    bytes32 market;
    uint optionType;
    uint strikeId;
    uint size;
    uint premium;
    uint positionId;
    uint expiry;
    uint strikePrice;
  }

  /************************************************
   *   STATE - HEDGE TRACKING
   ************************************************/

  uint[] public strikeIdsHedged;
  mapping(uint => uint) public hedgeAttemptsByStrikeId;

  uint[] public positionIdsHedged;
  mapping(uint => uint) public hedgeAttemptsByPositionId;

  /************************************************
   *  EVENTS
   ***********************************************/

  event Trade(address indexed vault, ActiveTrade[] activeTrades, uint round);

  event PositionReduced(uint positionId, uint amount);

  event RoundStarted(uint16 roundId, uint104 lockAmount);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(address user, uint16 roundId, uint currentCollateral);

  event KeeperUpdated(address owner, address keeper);

  /************************************************
   *  ERRORS
   ***********************************************/
  /// @notice given value cannot be zero
  /// @param valueName: name of the variable that cannot be zero
  error ValueCannotBeZero(bytes32 valueName);

  /// @notice Insufficient margin to pay fee
  error CannotPayFee();

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyKeeper() {
    require(msg.sender == keeper, 'NOT_KEEPER');
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
    require(vaultState.roundInProgress, 'round closed');

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
    for (uint i = 0; i < positionIdsHedged.length; i++) {
      uint positionIdHedged = positionIdsHedged[i];
      delete hedgeAttemptsByStrikeId[positionIdHedged];
    }

    positionIdsHedged = new uint[](0);
  }

  /**
   * @notice Start the next/new round
   */
  function startNextRound() external onlyOwner {
    //can't start next round before outstanding expired positions are settled.
    require(!vaultState.roundInProgress, 'round opened');
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, 'Delay between rounds not elapsed');
    require(address(strategy) != address(0), 'Strategy not set');
    // allow for multiple boardId selection and mostly check expiry is within strategy range
    // IStrategy(strategy).setBoard(boardId);

    (uint lockedBalance, uint queuedWithdrawAmount) = _rollToNextRound(uint(lastQueuedWithdrawAmount));

    vaultState.lockedAmount = uint104(lockedBalance);
    vaultState.lockedAmountLeft = lockedBalance;
    vaultState.roundInProgress = true;

    lastQueuedWithdrawAmount = uint128(queuedWithdrawAmount);

    emit RoundStarted(vaultState.round, uint104(lockedBalance));
  }

  /**
   * @notice Start the trade for the next/new round depending on strategy
   * @param _longTrades selected strikes to trade long
   * @param _shortTrades selected strikes to trade short
   */
  function trade(
    StrategyBase.StrikeTrade[] memory _longTrades,
    StrategyBase.StrikeTrade[] memory _shortTrades
  ) external onlyOwner {
    require(vaultState.roundInProgress, 'Round not opened');

    uint allCapitalUsed;
    uint positionId;
    uint premium;
    uint capitalUsed;
    uint expiry;
    uint strikePrice;

    uint longTradesLen = _longTrades.length;
    uint shortTradesLen = _shortTrades.length;

    uint len = longTradesLen + shortTradesLen;

    ActiveTrade[] memory activeTrades = new ActiveTrade[](len);

    /// @notice execute short
    for (uint i = 0; i < shortTradesLen; i++) {
      StrategyBase.StrikeTrade memory shortTrade = _shortTrades[i];
      (positionId, premium, capitalUsed, expiry, strikePrice) = IStrategy(strategy).trade(shortTrade);
      allCapitalUsed += capitalUsed;

      ActiveTrade memory activeTrade = ActiveTrade(
        shortTrade.market,
        shortTrade.optionType,
        shortTrade.strikeId,
        shortTrade.size,
        premium,
        positionId,
        expiry,
        strikePrice
      );
      activeTrades[i] = activeTrade;
    }

    /// @notice execute long
    for (uint i = 0; i < longTradesLen; i++) {
      StrategyBase.StrikeTrade memory longTrade = _longTrades[i];
      (positionId, premium, capitalUsed, expiry, strikePrice) = IStrategy(strategy).trade(longTrade);
      allCapitalUsed += capitalUsed;

      ActiveTrade memory activeTrade = ActiveTrade(
        longTrade.market,
        longTrade.optionType,
        longTrade.strikeId,
        longTrade.size,
        premium,
        positionId,
        expiry,
        strikePrice
      );
      activeTrades[i] = activeTrade;
    }

    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - allCapitalUsed;
    vaultState.tradesExecuted = true;

    emit Trade(address(this), activeTrades, vaultState.round);
  }

  /**
   * @notice Reduce position by keeper if position dangerous
   * @param _market bytes32
   * @param _positionId lyra position id
   * @param _closeAmount total amount to reduce
   */
  function reducePosition(bytes32 _market, uint _positionId, uint _closeAmount) external onlyOwner {
    IStrategy(strategy).reducePosition(_market, _positionId, _closeAmount);

    emit PositionReduced(_positionId, _closeAmount);
  }

  /************************************************
   *  Hedge Actions - Synthetix Futures
   ***********************************************/

  /**
   * @notice User hedge based on pricing of base asset
   * @param _market btc / eth
   * @param _size hedge position size
   */
  function userHedge(bytes32 _market, int _size) external onlyOwner {
    require(vaultState.roundInProgress, 'Round closed');
    // refactor transfer to synthetix when a hedge is needed to be opened only
    IStrategy(strategy).userHedge(_market, _size);
  }

  /**
   * @notice delta hedge based on strategy settings
   */
  function dynamicDeltaHedge(bytes32 _market, int _deltaToHedge, uint _positionId) external onlyKeeper {
    require(vaultState.roundInProgress, 'Round closed');

    uint deltaHedgeAttempts = hedgeAttemptsByPositionId[_positionId];

    IStrategy(strategy).dynamicDeltaHedge(_market, _deltaToHedge, deltaHedgeAttempts);

    hedgeAttemptsByPositionId[_positionId] = deltaHedgeAttempts + 1;
  }

  /**
   * @notice Close hedge by positionId
   * @param _positionId close hedge for positionId
   * @dev can check for events of closed rounds?
   */
  function closeHedgeByPositionId(uint _positionId) external onlyKeeper {
    IStrategy(strategy)._closeHedge();
    for (uint i = 0; i < positionIdsHedged.length; i++) {
      positionIdsHedged[i] = 0; // clear strike for now
    }
  }
}
