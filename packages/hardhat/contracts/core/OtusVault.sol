//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

// Libraries
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../synthetix/SafeDecimalMath.sol";
import {Vault} from "../libraries/Vault.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";

// controller
import "./OtusController.sol";

// Inherited
import {BaseVault} from "./BaseVault.sol";

/**
 * @title OtusVault
 * @author Lyra
 * @dev - Allows for maintaining vault
 */
contract OtusVault is BaseVault {
  using SafeMath for uint;
  using SafeDecimalMath for uint;

  /************************************************
   *  STATE
   ***********************************************/

  IERC20 public collateralAsset;

  OtusController public otusController;

  address public strategy;
  address public keeper;

  string public vaultName;
  string public vaultDescription;

  uint128 public lastQueuedWithdrawAmount;

  // add details for for vault type ~
  bool public isPublic;

  // only used when checking if valid strategy
  mapping(uint => address) public strategies;

  // mapping to check round strategy
  mapping(uint => address) public strategyByRound;

  /************************************************
   *  EVENTS
   ***********************************************/

  event RoundStarted(uint16 roundId, uint104 lockAmount);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(address user, uint16 roundId, uint currentCollateral);

  /************************************************
   *  ERRORS
   ***********************************************/
  /// @notice given value cannot be zero
  /// @param valueName: name of the variable that cannot be zero
  error ValueCannotBeZero(bytes32 valueName);

  /// @notice Insufficient margin to pay fee
  error CannotPayFee();

  /// @notice Strategy not valid for round
  error StrategyNotValidForRound();

  /// @notice Attempt to set same type of strategy
  error StrategyAlreadySet();

  /// @notice Strategy not valid for vault
  error StrategyNotValidForVault();

  /// @notice Strategy type not valid for vault
  error StrategyTypeNotValidForVault();
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

  constructor(uint _roundDuration, address _otusController) BaseVault(_roundDuration) {
    otusController = OtusController(_otusController);
  }

  /**
   * @notice Initializes contract on clone
   * @dev Should only be called by owner and only once
   * @param _owner owner of vault
   * @param _vaultInfo basic vault information
   * @param _vaultParams vault share information
   * @param _keeper address of keeper
   */
  function initialize(
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    address _keeper
  ) external {
    vaultName = _vaultInfo.name;
    vaultDescription = _vaultInfo.description;
    isPublic = _vaultInfo.isPublic;

    keeper = _keeper;

    collateralAsset = IERC20(_vaultParams.asset);

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
   *  PUBLIC VAULT ACTIONS
   ***********************************************/

  /**
   * @notice  Closes the current round, enable user to deposit for the next round
   */
  function closeRound() external onlyOwner {
    require(vaultState.roundInProgress, "round closed");

    uint104 lockAmount = vaultState.lockedAmount;
    vaultState.lastLockedAmount = lockAmount;
    vaultState.lockedAmountLeft = 0;
    vaultState.lockedAmount = 0;
    vaultState.nextRoundReadyTimestamp = block.timestamp + Vault.ROUND_DELAY;
    vaultState.roundInProgress = false;

    address _strategy = strategyByRound[vaultState.round];

    require(address(_strategy) != address(0), "Strategy not set");

    // execute all close/clean up methods required by strategy
    // won't be able to close if positions are not settled
    IStrategy(_strategy).close();

    emit RoundClosed(vaultState.round, lockAmount);
  }

  /**
   * @notice Start the next/new round
   */
  function startNextRound() external onlyOwner {
    //can't start next round before outstanding expired positions are settled.
    require(!vaultState.roundInProgress, "round opened");
    require(
      block.timestamp > vaultState.nextRoundReadyTimestamp,
      "Delay between rounds not elapsed"
    );

    (uint lockedBalance, uint queuedWithdrawAmount) = _rollToNextRound(
      uint(lastQueuedWithdrawAmount)
    );

    vaultState.lockedAmount = uint104(lockedBalance);
    vaultState.lockedAmountLeft = lockedBalance;
    vaultState.roundInProgress = true;

    lastQueuedWithdrawAmount = uint128(queuedWithdrawAmount);

    emit RoundStarted(vaultState.round, uint104(lockedBalance));
  }

  /************************************************
   *  Execute Manager Actions
   ***********************************************/
  /**
   * @notice Used for trade/investment
   * @param _strategy strategy address for vault
   * @param _data trade/investment functiona and param - bytes
   */
  function trade(address _strategy, bytes calldata _data) external onlyOwner {
    require(vaultState.roundInProgress, "Round closed");

    // validate strategy is valid for vault
    validate(_strategy);

    uint allCapitalUsed = IStrategy(_strategy).trade(_data);

    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - allCapitalUsed;
  }

  function execute(bytes calldata _data) external onlyOwner {
    require(vaultState.roundInProgress, "Round closed");
    // add guard
    address _strategy = strategyByRound[vaultState.round];
    (bool success, ) = _strategy.call(_data);
    require(success, "Execute failed");
    // userHedge
    // reducePosition
  }

  function keeperExecute(address _strategy, bytes memory data) external onlyKeeper {
    require(vaultState.roundInProgress, "Round closed");

    validate(strategy);
    (bool success, ) = IStrategy(_strategy).keeper(data);
    require(success, "Keeper execute failed");
    // dynamicDeltaHedge
    // closeHedgeByPositionId
  }

  /************************************************
   *  Strategy Update and Setters
   ***********************************************/

  /**
   * @notice Sets strategy available
   * @param _type type of strategy
   * @param _strategy address of strategy
   */
  function setStrategy(uint _type, address _strategy) public onlyOwner {
    //check type isn't set already
    if (strategies[_type] != address(0)) {
      revert StrategyAlreadySet();
    }

    //check if strategy address was instantiated by OtusController
    if (otusController.strategies(_strategy) == address(this)) {
      revert StrategyNotValidForVault();
    }

    if (otusController.types(_type) != true) {
      revert StrategyTypeNotValidForVault();
    }

    collateralAsset.approve(_strategy, type(uint).max);

    strategies[_type] = _strategy;
  }

  /**
   * @notice Sets strategy for next round
   * @param _type of strategy
   */
  function setNextRoundStrategy(uint _type) internal onlyOwner {
    // validate implemenation for strategy instance address
    // only set for next round if round open
    // if round closed set for current
    address _strategy = strategies[_type];

    if (_strategy == address(0)) {
      revert StrategyTypeNotValidForVault();
    }

    uint round = vaultState.round;

    if (vaultState.roundInProgress) {
      strategyByRound[round + 1] = _strategy;
    } else {
      strategyByRound[round] = _strategy;
    }
  }

  /************************************************
   *  Validate
   ***********************************************/

  /**
   * @notice Validates strategy for vault
   * @param _strategy address of strategy
   */
  function validate(address _strategy) internal returns (bool valid) {
    address _roundStrategy = strategyByRound(vaultState.round);

    if (_strategy != _roundStrategy) {
      revert StrategyNotValidForRound();
    }

    valid = true;
  }
}
