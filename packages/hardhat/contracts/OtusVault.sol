//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

// Hardhat
import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import './interfaces/IFuturesMarket.sol';

import {BaseVault} from "./BaseVault.sol";
import {Vault} from "./libraries/Vault.sol";
import {Strategy} from "./Strategy.sol";

/// @notice LyraVault help users run option-selling strategies on Lyra AMM.
contract OtusVault is BaseVault {
  using SafeMath for uint;

  /************************************************
  *  IMMUTABLES & CONSTANTS
  ***********************************************/
  address public immutable keeper; 

  Strategy public _strategy;
  address public supervisor; 
  string public vaultName; 
  // Amount locked for scheduled withdrawals last week;
  uint128 public lastQueuedWithdrawAmount;
  uint256 public currentExpiry; 
  uint256 public roundHedgeAttempts; 
  uint public roundPremiumCollected; 
  uint256 public roundExpiry; 
  bool public activeShort; 

  IERC20 collateralAsset; 

  enum VaultType {
    SHORT_PUT,
    SHORT_CALL,
    APE_BULL, 
    SHORT_STRADDLE,
    SHORT_STRANGLE
  }

  // add details for for vault type ~
  uint public otusVaultType; 
  bool public isPublic;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address strategy);

  event Trade(address user, uint[] positionId, uint16 roundId, uint[] premium);

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
    uint _roundDuration,
    address _keeper
  ) BaseVault(_roundDuration) {
    keeper = _keeper; 
  }

  /**
  * @notice Initializes contract on clone
  * @dev Should only be called by owner and only once
  * add checks that supervisor is valid
  */
  function initialize(
    address _owner,
    address _supervisor, 
    string memory _vaultName,
    string memory _tokenName,
    string memory _tokenSymbol,
    bool _isPublic, 
    uint _otusVaultType,
    Vault.VaultParams memory _vaultParams
  ) external {
    supervisor = _supervisor; 
    vaultName = _vaultName; 
    isPublic = _isPublic; 
    otusVaultType = _otusVaultType; 
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
  * @param __strategy is the address of the strategy contract
  */
  function setStrategy(address __strategy) public onlyOwner {
    _strategy = Strategy(__strategy);
    collateralAsset = IERC20(vaultParams.asset);
    collateralAsset.approve(__strategy, type(uint).max);
    // collateralAsset.approve(futuresMarket, type(uint).max);
    emit StrategyUpdated(__strategy);
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
    _strategy.returnFundsAndClearStrikes();

    emit RoundClosed(vaultState.round, lockAmount);
  }

  /**
   * @notice Start the next/new round
   */
  function startNextRound(uint boardId) external onlyOwner {
    //can't start next round before outstanding expired positions are settled. 
    require(!vaultState.roundInProgress, "round opened");
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, "CD");
    require(address(_strategy) != address(0), "Strategy not set");
    _strategy.setBoard(boardId);

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
  function trade(Strategy.StrikeStrategyDetail[] memory _currentStrikeStrategies) external onlyOwner {
    // can trade during round as long as lockedAmount is greater than 0
    // round should be opened 
    require(vaultState.roundInProgress, "round not opened");
    (uint[] memory positionId, uint[] memory premiumReceived, uint[] memory _collateralAdded) = _strategy.doTrades(_currentStrikeStrategies);
    for(uint i = 0; i < premiumReceived.length; i++) {
      roundPremiumCollected += premiumReceived[i];
    }
    // update the remaining locked amount
    uint collateralAdded; 
    for(uint i = 0; i < _collateralAdded.length; i++) {
      collateralAdded += _collateralAdded[i];
    }
    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - collateralAdded;
    emit Trade(msg.sender, positionId, vaultState.round, premiumReceived);
  }

  function _hedge() internal {}

  /// @dev anyone close part of the position with premium made by the strategy if a position is dangerous
  /// @param positionId the positiion to close
  function reducePosition(uint positionId, uint size, uint closeAmount) external onlyKeeper {
    _strategy.reducePosition(positionId, size, closeAmount);
  }

  /************************************************
   *  KEEPER ACTIONS
   ***********************************************/

  /**
   * @dev this should be executed after the vault execute trade on OptionMarket and by keeper
  //  */
  // function openHedgePosition() external onlyKeeper {
  //   require(vaultState.roundInProgress, "Round closed");
  //   activeShort = _strategy._openKwentaPosition(roundHedgeAttempts);
  // }

  /**\
  * @dev called by keeper 
  * update vault collateral, call 
  */
  function closeHedge() external onlyKeeper {
    activeShort = _strategy._closeKwentaPosition();
  }

}
