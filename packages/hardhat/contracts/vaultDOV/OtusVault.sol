//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../interfaces/IFuturesMarket.sol";
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

  /************************************************
   *  IMMUTABLES & CONSTANTS
   ***********************************************/
  address public strategy;
  address public keeper;

  string public vaultName;
  string public vaultDescription;

  uint128 public lastQueuedWithdrawAmount;
  uint public roundPremiumCollected;

  IERC20 collateralAsset;

  // add details for for vault type ~
  bool public isPublic;

  /************************************************
   *   HEDGE TRACKING
   ************************************************/

  bool public hasFuturesHedge;
  mapping(uint => uint) public hedgeAttemptsByOptionType;
  mapping(uint => bool) public activeHedgeByOptionType;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address strategy);

  event Trade(address indexed vault, uint[] positionId, uint16 roundId, uint premium);

  event RoundStarted(uint16 roundId, uint104 lockAmount);

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

  function setKeeper(address _keeper) public onlyOwner {
    keeper = _keeper;
    emit KeeperUpdated(msg.sender, _keeper);
  }

  /************************************************
   *  PUBLIC ACTIONS
   ***********************************************/

  /**
   * @notice Closes the current round, enable user to deposit for the next round
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

    if (hasFuturesHedge == true) {
      _clearHedges();
    }

    emit RoundClosed(vaultState.round, lockAmount);
  }

  function _clearHedges() internal {
    // withdraw all margin from futures market
    // _strategy.closeHedgeEndOfRound();

    for (uint i = 3; i <= 4; i++) {
      delete hedgeAttemptsByOptionType[i];
      delete activeHedgeByOptionType[i];
    }

    hasFuturesHedge = false;
  }

  /**
   * @notice Start the next/new round
   */
  function startNextRound(uint boardId) external onlyOwner {
    //can't start next round before outstanding expired positions are settled.
    require(!vaultState.roundInProgress, "round opened");
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, "CD");
    require(address(strategy) != address(0), "Strategy not set");
    IStrategy(strategy).setBoard(boardId);

    (uint lockedBalance, uint queuedWithdrawAmount) = _rollToNextRound(uint(lastQueuedWithdrawAmount));

    vaultState.lockedAmount = uint104(lockedBalance);
    vaultState.lockedAmountLeft = lockedBalance;
    vaultState.roundInProgress = true;

    lastQueuedWithdrawAmount = uint128(queuedWithdrawAmount);

    emit RoundStarted(vaultState.round, uint104(lockedBalance));
  }

  /**
   * @notice Start the trade for the next/new round depending on strategy
   */
  function trade(StrategyBase.StrikeTrade[] memory _strikes) external onlyOwner returns (uint[] memory positionIds) {
    // can trade during round as long as lockedAmount is greater than 0
    // round should be opened
    require(vaultState.roundInProgress, "round not opened");
    require(!vaultState.tradesExecuted, "trades executed for round");

    uint allCapitalUsed;
    uint positionId;
    uint premiumReceived;
    uint capitalUsed;
    uint len = _strikes.length;
    positionIds = new uint[](len);

    for (uint i = 0; i < len; i++) {
      StrategyBase.StrikeTrade memory _trade = _strikes[i];
      (positionId, premiumReceived, capitalUsed) = IStrategy(strategy).doTrade(_trade);
      roundPremiumCollected += premiumReceived;
      allCapitalUsed += capitalUsed;
      positionIds[i] = positionId;
      hasFuturesHedge = _trade.futuresHedge;
    }

    // update the remaining locked amount -- lockedAmountLeft can be used for hedge
    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - allCapitalUsed;
    vaultState.tradesExecuted = true;

    emit Trade(address(this), positionIds, vaultState.round, premiumReceived);
  }

  /// @dev anyone close part of the position with premium made by the strategy if a position is dangerous
  /// @param positionId the positiion to close
  function reducePosition(uint positionId, uint closeAmount) external onlyKeeper {
    IStrategy(strategy).reducePosition(positionId, closeAmount);
  }

  /************************************************
   *  Hedge Actions - Synthetix Futures
   ***********************************************/

  /**
   * @dev this should be executed after the vault execute trade on OptionMarket and by keeper
  //  */
  // function hedge(uint optionType) external returns (uint) {
  //   return optionType;
  // }

  // 3 types of hedges
  // simple 1 click hedge
  // auto simple hedge
  // auto delta hedge

  function hedge(uint optionType) external onlyKeeper {
    require(vaultState.roundInProgress, "Round closed");
    require(hasFuturesHedge, "Vault is not hedging strikes");
    require(activeHedgeByOptionType[optionType] == false, "Vault has hedge for option type");

    uint hedgeAttempts = hedgeAttemptsByOptionType[optionType];

    // locked amout left has to be
    IStrategy(strategy)._hedge(optionType, vaultState.lockedAmountLeft, hedgeAttempts);

    // track by option type hedge attempts
    hedgeAttemptsByOptionType[optionType] = hedgeAttempts + 1;
    activeHedgeByOptionType[optionType] = true;
  }

  function closeHedge(uint optionType) external onlyKeeper {
    require(activeHedgeByOptionType[optionType], "Vault has no active hedge for option type");
    IStrategy(strategy)._closeHedge();
    activeHedgeByOptionType[optionType] = false;
  }

  /**
   * @dev - used for testing
   */
  function withdrawSUSDSNX() public {
    uint balance = IERC20(0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57).balanceOf(address(this));
    // IERC20(0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57000737919682).transferFrom(address(this), msg.sender, balance);
  }
}
