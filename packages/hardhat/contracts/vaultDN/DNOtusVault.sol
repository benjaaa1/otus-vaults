//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import '../interfaces/IFuturesMarket.sol';
import {IDNStrategy} from "../interfaces/IDNStrategy.sol";

import {BaseVault} from "../vault/BaseVault.sol";
import {Vault} from "../libraries/Vault.sol";

contract DNOtusVault is BaseVault {
  using SafeMath for uint;

  /************************************************
  *  IMMUTABLES & CONSTANTS
  ***********************************************/
  address public strategy;
  address public keeper; 

  string public vaultName; 
  string public vaultDescription; 
  // Amount locked for scheduled withdrawals last week;
  uint128 public lastQueuedWithdrawAmount;

  IERC20 collateralAsset; 

  // add details for for vault type ~
  bool public isPublic;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address strategy);

  event Trade(address user, uint positionId, uint16 roundId, uint premium);

  event RoundStarted(uint16 roundId, uint104 lockAmount);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(address user, uint16 roundId, uint currentCollateral);

  event KeeperUpdated(address user, address keeper);

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
  */
  function initialize(
    address _owner,
    Vault.VaultInformation memory _vaultInfo, 
    Vault.VaultParams memory _vaultParams,
    address _strategy
  ) external {

    vaultName = _vaultInfo.name; 
    vaultDescription = _vaultInfo.description; 
    isPublic = _vaultInfo.isPublic; 

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
  function closeRound() external {
    uint104 lockAmount = vaultState.lockedAmount;
    vaultState.lastLockedAmount = lockAmount;
    vaultState.lockedAmountLeft = 0;
    vaultState.lockedAmount = 0;
    vaultState.nextRoundReadyTimestamp = block.timestamp + Vault.ROUND_DELAY;
    vaultState.roundInProgress = false;

    emit RoundClosed(vaultState.round, lockAmount);
  }

  /**
   * @notice Start the next/new round
   */
  function startNextRound() external onlyOwner {
    require(!vaultState.roundInProgress, "round opened");
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, "CD");
    require(address(strategy) != address(0), "Strategy not set");

    (uint lockedBalance, uint queuedWithdrawAmount) = _rollToNextRound(uint(lastQueuedWithdrawAmount));

    vaultState.lockedAmount = uint104(lockedBalance);
    vaultState.lockedAmountLeft = lockedBalance;
    vaultState.roundInProgress = true;

    lastQueuedWithdrawAmount = uint128(queuedWithdrawAmount);

    emit RoundStarted(vaultState.round, uint104(lockedBalance));
  }

  function endRounds() external onlyOwner {
    
    // won't be able to close if funds are not returned to vault traded back from base asset
    IDNStrategy(strategy).returnFunds();

  }

  /**
   * @notice Start the trade for the next/new round depending on strategy
   */
  function trade() external onlyOwner {
    // can trade during round as long as lockedAmount is greater than 0
    // round should be opened 
    require(vaultState.roundInProgress, "round not opened");

    uint positionId;
    uint premiumReceived;
    uint capitalUsed;

    (positionId, capitalUsed) = IDNStrategy(strategy).doTrade();
    
    // update the remaining locked amount -- lockedAmountLeft can be used for hedge
    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - capitalUsed;

    emit Trade(msg.sender, positionId, vaultState.round, premiumReceived);
  }

}
