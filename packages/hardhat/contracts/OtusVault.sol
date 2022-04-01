//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {ISynthetix} from "./synthetix/ISynthetix.sol";
import {IOptionMarket} from "./lyra/IOptionMarket.sol";
import {IFuturesMarket} from "./kwenta/IFuturesMarket.sol";

import {BaseVault} from "./BaseVault.sol";
import {Strategy} from "./strategies/Strategy.sol";
import {Vault} from "./libraries/Vault.sol";

/// @notice LyraVault help users run option-selling strategies on Lyra AMM.
contract OtusVault is Ownable, BaseVault {
  using SafeMath for uint;

  string public vaultName; 
  Strategy public strategy;
  // Amount locked for scheduled withdrawals last week;
  uint128 public lastQueuedWithdrawAmount;
  uint256 public currentExpiry; 
  uint256 public keeper; 

  /************************************************
   *  IMMUTABLES & CONSTANTS
   ***********************************************/
  
  /// @notice Fee
  IOptionMarket public immutable optionMarket;
  /// @notice Fee
  IFuturesMarket public immutable futuresMarket;
  /// @notice Fee
  ISynthetix public immutable synthetix;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address strategy);

  event Trade(address user, uint positionId, uint premium);

  event RoundStarted(uint16 roundId, uint104 lockAmount);

  event RoundClosed(uint16 roundId, uint104 lockAmount);

  event RoundSettled(uint16 roundId, uint currentCollateral);

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
    address _optionMarket,
    address _futuresMarket, 
    address _susd,
    address _feeRecipient,
    address _synthetix,
    uint _roundDuration,
    string memory _tokenName,
    string memory _tokenSymbol,
    Vault.VaultParams memory _vaultParams
  ) BaseVault(_feeRecipient, _roundDuration, _tokenName, _tokenSymbol, _vaultParams) {
    optionMarket = IOptionMarket(_optionMarket);
    futuresMarket = IFuturesMarket(_futuresMarket);

    synthetix = ISynthetix(_synthetix);
    IERC20(_vaultParams.asset).approve(_optionMarket, type(uint).max);
    IERC20(_vaultParams.asset).approve(_futuresMarket, type(uint).max);
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
    emit StrategyUpdated(_strategy);
  }

  /**
  * @notice Sets the keeper of the vault
  * @param _keeper is the address of the _keeper
  */
  function setKeeper(address _keeper) external onlyOwner {
    keeper =_keeper;
    emit KeeperUpdated(_keeper);
  }

  /************************************************
   *  PUBLIC ACTIONS
   ***********************************************/

  /**
   * @notice Closes the current round, enable user to deposit for the next round
   */
  function closeRound() external {
    require(block.timestamp < currentExpiry, "Close round after current expiry");
    uint104 lockAmount = vaultState.lockedAmount;
    vaultState.lastLockedAmount = lockAmount;
    vaultState.lockedAmountLeft = 0;
    vaultState.lockedAmount = 0;
    vaultState.nextRoundReadyTimestamp = block.timestamp.add(Vault.ROUND_DELAY); // 12 hour delay til next round starts
    vaultState.roundInProgress = false;
    vaultState.roundHedgeAttempts = 0; 

    emit RoundClosed(vaultState.round, lockAmount);
  }

  /**
   * @notice Settle outstanding positions after closing round.
   */
  function settle() public {
    require(!vaultState.roundInProgress, "round opened");
    require(block.timestamp > vaultState.currentExpiry, "ROUND_NOT_OVER");
    /// Settle all the options sold from last round
    strategy.settleRound();
    uint currentCollateral = IERC20(vaultParams.asset).balanceOf(address(this));
    // if roundEndCollateral + premiumCollected > startCollateral 
    // => charge performance and management fees on the difference. 
    valultState.previousRoundSettled = true; 
    emit RoundSettled(msg.sender, currentCollateral);
  }

  /************************************************
   *  KEEPER ACTIONS - FOR NOW ONLY OWNER ACTIONS
   ***********************************************/

  /**
   * @notice Start the next/new round
   */
  function nextRound() external onlyKeeper {
    //can't start next round before outstanding expired positions are settled. 
    require(!vaultState.roundInProgress && valultState.previousRoundSettled, "round opened");
    require(block.timestamp > vaultState.nextRoundReadyTimestamp, "CD");

    (uint lockedBalance, uint queuedWithdrawAmount) = _rollToNextRound(uint(lastQueuedWithdrawAmount));

    vaultState.lockedAmount = uint104(lockedBalance);
    vaultState.lockedAmountLeft = lockedBalance;
    vaultState.roundInProgress = true;
    valultState.previousRoundSettled = false; 

    lastQueuedWithdrawAmount = uint128(queuedWithdrawAmount);

    emit RoundStarted(vaultState.round, uint104(lockedBalance));
  }


  /**
   * @notice Start the trade for the next/new round depending on strategy
   */
  function nextRoundTrade() external onlyKeeper {
    // can only make a trade after the next round is in progress and before trade period 
    // after everything we should update a vaultState param to show trade in progress
    // period between startnextround and closeround
    require(vaultState.roundInProgress && valultState.previousRoundSettled, "round closed"); 
    uint currentCollateral = IERC20(vaultParams.asset).balanceOf(address(this));
    (
      uint premiumCollected, 
      uint256 optionsCollateral, 
      uint256 hedgeCollateral, 
      uint256 expiry
    ) = strategy.startTradeForRound(currentCollateral);
    uint collateralAfter = IERC20(vaultParams.asset).balanceOf(address(this));
    uint assetUsed = currentCollateral.sub(collateralAfter);

    vaultState.lockedAmountLeft = vaultState.lockedAmountLeft.sub(assetUsed);
    vaultState.roundPremiumCollected = premiumCollected;
    vaultState.roundOptionsCollateral = optionsCollateral;
    vaultState.roundHedgeCollateral = hedgeCollateral;
    vaultState.currentExpiry = expiry; 

    emit Trade(msg.sender, positionId, realPremium);
  }
}
