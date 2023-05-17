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
import {OtusController} from "./OtusController.sol";

// Inherited
import {BaseVault} from "./BaseVault.sol";

/*
 * Otus Vault
 * =================
 *
 * Manage manager's vault state (including user deposits and withdrawals)
 * and access to funds for trading based on active strategy (options / futures).
 * Users can set the round expiration, any user can close the round if the expiration
 * date has been reached. Otus keeper will close round if necessary (to release user funds).
 *
 *
 */

/**
 * @title OtusVault
 * @author Lyra
 */
contract OtusVault is BaseVault {
  using SafeMath for uint;
  using SafeDecimalMath for uint;

  /************************************************
   *  STATE
   ***********************************************/

  IERC20 public collateralAsset;

  OtusController public otusController;

  address public keeper;

  string public vaultName;
  string public vaultDescription;

  uint128 public lastQueuedWithdrawAmount;

  // add details for for vault type ~
  bool public isPublic;

  // current active strategy for vault
  /// @dev will be able to support multiple strategies
  mapping(bytes32 => address) public strategies;

  /// @dev list of strategytypes
  bytes32 public roundStrategyTypes;

  /************************************************
   *  EVENTS
   ***********************************************/

  event RoundStarted(uint16 roundId, uint104 lockAmount);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(address user, uint16 roundId, uint currentCollateral);

  event VaultSettingUpdated(address user, Vault.VaultInformation _vaultInfo);

  event VaultStrategyUpdated(address indexed _vault, bytes32 _type, address _strategy);

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

  /// @notice Round not valid to be closed
  error RoundStillValid(uint timestamp, uint roundExpiration);

  /// @notice Round duration set not valid
  error RoundDurationNotValid();

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

  constructor(address _otusController) BaseVault() {
    otusController = OtusController(_otusController);
  }

  /**
   * @notice Initializes contract on clone
   * @dev Should only be called by owner and only once
   * @param _owner owner of vault
   * @param _vaultInfo basic vault information
   * @param _vaultParams vault share information
   */
  function initialize(
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams
  ) external {
    vaultName = _vaultInfo.name;
    vaultDescription = _vaultInfo.description;
    isPublic = _vaultInfo.isPublic;

    collateralAsset = IERC20(_vaultParams.asset);

    baseInitialize(
      _owner,
      _vaultInfo.tokenName,
      _vaultInfo.tokenSymbol,
      _vaultInfo.performanceFee,
      _vaultParams
    );
  }

  /************************************************
   *  VAULT SETTERS
   ***********************************************/

  /**
   * @notice Updates vault settings
   * @param _vaultInfo basic vault information
   * @dev Should only be updated when vault is closed
   */
  function setVaultSetting(Vault.VaultInformation memory _vaultInfo) external onlyOwner {
    require(!vaultState.roundInProgress, "round opened");

    vaultName = _vaultInfo.name;
    vaultDescription = _vaultInfo.description;
    isPublic = _vaultInfo.isPublic;

    emit VaultSettingUpdated(msg.sender, _vaultInfo);
  }

  /************************************************
   *  PUBLIC VAULT STRATEGY ACTIONS
   ***********************************************/

  /**
   * @notice  Closes the current round, enable user to deposit for the next round
   * @dev can be closed by anyone as long as round end time is < block timestamp
   */
  function closeRound() external {
    require(vaultState.roundInProgress, "round closed");
    _validClose();

    uint104 lockAmount = vaultState.lockedAmount;
    vaultState.lastLockedAmount = lockAmount;
    vaultState.lockedAmountLeft = 0;
    vaultState.lockedAmount = 0;
    vaultState.nextRoundReadyTimestamp = block.timestamp + Vault.ROUND_DELAY;
    vaultState.roundInProgress = false;

    // won't be able to close if positions are not settled
    for (uint i = 0; i < roundStrategyTypes.length; i++) {
      bytes32 roundStrategyType = roundStrategyTypes[i];
      address strategy = strategies[roundStrategyType];
      IStrategy(strategy).close();
      // execute all close/clean up methods required by strategy
      collateralAsset.approve(strategy, type(uint).min);
    }

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

    // won't be able to close if positions are not settled
    for (uint i = 0; i < roundStrategyTypes.length; i++) {
      bytes32 roundStrategyType = roundStrategyTypes[i];
      address strategy = strategies[roundStrategyType];
      collateralAsset.approve(strategy, type(uint).min);
    }

    emit RoundStarted(vaultState.round, uint104(lockedBalance));
  }

  /************************************************
   *  Execute Manager Actions
   ***********************************************/
  /**
   * @notice Used for trade/investment
   * @param _data trade/investment function and param - bytes
   * @dev OPTIONS => trade options
   * @dev FUTURES => trade perps
   * @dev LENDING => trade for aTokens
   * @dev SWAP => trade spot
   * @dev NFT => trade NFT
   */
  function trade(bytes32 _strategyType, bytes calldata _data) external onlyOwner {
    require(vaultState.roundInProgress, "Round closed");
    address strategy = strategies[_strategyType];
    uint round = vaultState.round;
    // capital used includes committed margin for
    // limit orders and hedging
    uint allCapitalUsed = IStrategy(strategy).trade(_data, round);

    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft - allCapitalUsed;
  }

  function execute(bytes32 _strategyType, bytes calldata _data) external onlyOwner {
    require(vaultState.roundInProgress, "Round closed");
    // check function signature
    address strategy = strategies[_strategyType];

    _validFunction(_data);
    // options - reducePosition close
    // @sol-ignore avoid-low-level-calls
    (bool success, ) = strategy.call(_data);
    require(success, "Execute failed");
  }

  /************************************************
   *  Round Duration - 1 day to 4 weeks
   ***********************************************/

  function setRoundDuration(uint _duration) external onlyOwner {
    require(!vaultState.roundInProgress, "round opened");
    _validDuration(_duration);
    vaultState.roundExpiration = vaultState.nextRoundReadyTimestamp + _duration;
  }

  /************************************************
   *  Strategy Update and Setters
   ***********************************************/

  /**
   * @notice Sets strategies for vault
   * @param _type of strategy OPTIONS / FUTURES / LEND / SWAP
   */
  function setStrategy(string memory _type) external onlyOwner {
    require(!vaultState.roundInProgress, "round opened");

    bytes32 _etype = keccak256(abi.encodePacked(_type));

    bool _valid = otusController._validateVaultStrategy(_etype);

    if (!_valid) {
      revert StrategyTypeNotValidForVault();
    }

    OtusController.VaultStrategy[] memory vaultStrategies = otusController._getStrategies(
      address(this)
    );

    for (uint i = 0; i < vaultStrategies.length; i++) {
      if (
        vaultStrategies[i].strategyType == _etype &&
        vaultStrategies[i].strategyInstance != address(0)
      ) {
        address strategy = vaultStrategies[i].strategyInstance;
        strategies[_etype] = strategy;
        emit VaultStrategyUpdated(address(this), _etype, strategy);
      }
    }
  }

  /************************************************
   *  Validate
   ***********************************************/

  /**
   * @notice Validates close round time to release funds
   */
  function _validClose() internal view {
    if (block.timestamp < vaultState.roundExpiration) {
      revert RoundStillValid(block.timestamp, vaultState.roundExpiration);
    }
  }

  /**
   * @notice Validates close round time to release funds
   * @param _duration set by vault owner
   */
  function _validDuration(uint _duration) internal view {
    // round delay is 12 hours constant
    uint minDuration = otusController.minDuration();
    uint maxDuration = otusController.maxDuration();

    if (minDuration > _duration) {
      revert RoundDurationNotValid();
    }

    if (maxDuration < _duration) {
      revert RoundDurationNotValid();
    }
  }

  /**
   * @notice Validates close round time to release funds
   * @param _data set by vault owner
   */
  function _validFunction(bytes calldata _data) internal view {
    (bool _valid, bytes32 _method) = otusController._validateFunctionSignature(_data);
    if (!_valid) {
      revert MethodCallNotValid(msg.sender, _method);
    }
  }

  error MethodCallNotValid(address user, bytes32 method);
}
