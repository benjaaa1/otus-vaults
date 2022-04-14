//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import './interfaces/IFuturesMarket.sol';

import {BaseVault} from "./BaseVault.sol";
import {Vault} from "./libraries/Vault.sol";
import {Strategy} from "./Strategy.sol";

/// @notice LyraVault help users run option-selling strategies on Lyra AMM.
contract OtusVault is BaseVault {
  using SafeMath for uint;

  address public supervisor; 
  string public vaultName; 
  Strategy public strategy;
  // Amount locked for scheduled withdrawals last week;
  uint128 public lastQueuedWithdrawAmount;
  uint256 public currentExpiry; 
  address public keeper; 
  uint256 public roundHedgeAttempts; 
  uint public roundPremiumCollected; 
  uint256 public roundExpiry; 
  bool public activeShort; 

  IERC20 collateralAsset; 

  /************************************************
   *  IMMUTABLES & CONSTANTS
   ***********************************************/

  // IFuturesMarket public immutable futuresMarket;
  address public immutable futuresMarket;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address strategy);

  event Trade(address user, uint16 roundId, uint premium);

  event RoundStarted(uint16 roundId, uint104 lockAmount);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(address user, uint16 roundId, uint currentCollateral);

  event KeeperUpdated(address keeper);

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyKeeper {
    require(msg.sender == keeper, "NOT_KEEPER");
    _;
  }

  /************************************************
  *  CONSTRUCTOR & INITIALIZATION
  ***********************************************/

  constructor(
    address _futuresMarket,
    uint _roundDuration
  ) BaseVault(_roundDuration) {
    futuresMarket = _futuresMarket;
  }

  /**
  * @notice Initializes contract on clone
  * @dev Should only be called by owner and only once
  */
  function initialize(
    address _owner,
    address _supervisor, 
    string memory _tokenName,
    string memory _tokenSymbol,
    Vault.VaultParams memory _vaultParams
  ) external {

    supervisor = _supervisor; 
    baseInitialize(
      _owner,
      _supervisor, 
      _tokenName, 
      _tokenSymbol, 
      _vaultParams
    ); 

  }

  /************************************************
   *  SETTERS
   ***********************************************/

  /**
  * @notice Sets the strategy contract
  * @param _strategy is the address of the strategy contract
  */
  function setStrategy(address _strategy) external onlyOwner {
    strategy = Strategy(_strategy);
    collateralAsset = IERC20(vaultParams.asset);
    collateralAsset.approve(_strategy, type(uint).max);
    collateralAsset.approve(futuresMarket, type(uint).max);
    emit StrategyUpdated(_strategy);
  }

  /************************************************
   *  PUBLIC ACTIONS
   ***********************************************/

  /**
   * @notice Closes the current round, enable user to deposit for the next round
   */
  function closeRound() external {
    uint104 lockAmount = vaultState.lockedAmount;
    vaultState.lastLockedAmount = lockAmount;
    vaultState.lockedAmountLeft = 0;
    vaultState.lockedAmount = 0;
    vaultState.nextRoundReadyTimestamp = block.timestamp + Vault.ROUND_DELAY;
    vaultState.roundInProgress = false;
    roundHedgeAttempts = 0; 

    // won't be able to close if positions are not settled
    strategy.returnFundsAndClearStrikes();

    emit RoundClosed(vaultState.round, lockAmount);
  }

  /************************************************
   *  KEEPER ACTIONS
   ***********************************************/

  /**
   * @notice Start the next/new round
   */
  function startNextRound(uint boardId) external onlyOwner {
    //can't start next round before outstanding expired positions are settled. 
    require(!vaultState.roundInProgress, "round opened");
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, "CD");

    // move this to be set auto 
    strategy.setBoard(boardId);

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
  function trade(uint strikeId) external {
    // can only make a trade after the next round is in progress and before trade period 
    // after everything we should update a vaultState param to show trade in progress
    // period between startnextround and closeround
    require(vaultState.roundInProgress, "round closed");
    uint currentCollateral = collateralAsset.balanceOf(address(this));
    (uint positionId, uint premiumReceived, uint collateralAdded) = strategy.startTradeForRound(strikeId, currentCollateral);
    uint collateralAfter = collateralAsset.balanceOf(address(this));
    uint assetUsed = currentCollateral.sub(collateralAfter);

    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft.sub(assetUsed);
    
    roundPremiumCollected = premiumReceived;

    emit Trade(msg.sender, vaultState.round, premiumReceived);
  }

  /// @dev anyone close part of the position with premium made by the strategy if a position is dangerous
  /// @param positionId the positiion to close
  function reducePosition(uint positionId) external onlyKeeper {
    strategy.reducePosition(positionId);
  }

  /**
   * @dev this should be executed after the vault execute trade on OptionMarket and by keeper
   */
  function openPosition() external onlyKeeper {
    require(vaultState.roundInProgress, "Round closed");
    activeShort = strategy._openKwentaPosition(roundHedgeAttempts);
  }

  /**
  * @dev called by keeper 
  * update vault collateral, call 
  */
  function closeHedge() external onlyKeeper {
    activeShort = strategy._closeKwentaPosition();
  }

}
