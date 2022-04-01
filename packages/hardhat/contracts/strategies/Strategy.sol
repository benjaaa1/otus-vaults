//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

// Hardhat
import "hardhat/console.sol";

// Interfaces
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOptionMarket} from "../lyra/IOptionMarket.sol";
import {IFuturesMarket} from "../kwenta/IFuturesMarket.sol";

// Libraries
import "../synthetix/SafeDecimalMath.sol";
import "../synthetix/SignedSafeDecimalMath.sol";

// Vault 
import {OtusVault} from "../OtusVault.sol";

contract Strategy is Ownable {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  address public immutable vault;
  address public immutable optionMarket;
  address public immutable futuresMarket;
  
  OtusVault otusVault; 

  uint256 public keeper; 

  // strategies can be updated by different strategizers
  struct StrategyDetail {
    string strategyName; 
    uint minTimeToExpiry;
    uint maxTimeToExpiry;
    int targetDelta;
    int maxDeltaGap;
    uint minIv;
    uint maxIv;
    uint size;
    uint minInterval;
    uint collateralPercentage; 
    uint requiredLeveragedHedge; 
    int maxHedgeAttempts; 
    uint hedgeStopLossLimit; 
    uint256 currentListingId; // hardcoded for now but should be chosen based on criteria 
    IOptionMarket.TradeType tradeType;
  }

  StrategyDetail public currentStrategy;

  /************************************************
   *  EVENTS
   ***********************************************/

  event KeeperUpdated(address keeper);

  event HedgeClosePosition(address closer);

  event HedgeModifyPosition(address closer, uint256 marginDelta, int hedgeAttempt);


  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyKeeper {
    require(msg.sender == keeper, "NOT_KEEPER");
    _;
  }

  modifier onlyVault {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /************************************************
   *  ADMIN
   ***********************************************/

  constructor(address _vault, address _optionMarket, address _futuresMarket) {
    vault = _vault;
    otusVault = OtusVault(vault); 
    optionMarket = _optionMarket; // remove from here and move to vault
    futuresMarket = _futuresMarket; // remove from here and move to vault

    IERC20(otusVault.vaultParams.asset).safeApprove(address(optionMarket), collateral);
    IERC20(otusVault.vaultParams.asset).safeApprove(address(futuresMarket), collateral);
  }

  /************************************************
   *  SETTERS
   ***********************************************/
  /**
   * @dev update the strategy for the new round.
   * strategy should be updated weekly after previous round ends 
   */
  function setStrategy(StrategyDetail memory _strategy) external onlyOwner {
    require(!otusVault.vaultState.roundInProgress, "round opened");
    currentStrategy = _strategy;
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
   *  VAULT ACTIONS
   ***********************************************/

   /**
   * @notice request trade detail according to the strategy. 
   */
  function startTradeForRound(uint collateral) external view onlyVault returns (uint premiumCollected, uint256 roundExpiry) {
    // WILL BE UPDATED AFTER LYRA AVALON RELEASE
    (,uint256 strikePrice,,,,,, uint256 boardId) = IOptionMarket(optionMarket).optionListings(currentStrategy.currentListingId);
    (, uint256 expiry,,) = IOptionMarket(optionMarket).optionBoards(boardId);

    uint256 oCollateral = collateral.multiplyDecimal(currentStrategy.collateralPercentage / 100); 
    uint256 hCollateral = collateral.sub(collateral.multiplyDecimal(currentStrategy.collateralPercentage / 100));

    IFuturesMarket(futuresMarket).transferMargin(hedgeCollateral);

    premiumCollected = IOptionMarket(optionMarket).openPosition(
      currentStrategy.currentListingId, 
      currentStrategy.tradeType, 
      optionsCollateral 
    );

    optionsCollateral = oCollateral; 
    hedgeCollateral = hCollatera; 
    roundExpiry = expiry; 
  }

  /**
  * @notice 
  */
  function settleRound() external onlyVault {
    IOptionMarket(optionMarket).settleOptions(currentStrategy.currentListingId, currentStrategy.tradeType);
  }

  /************************************************
   *  KEEPER ACTIONS
   ***********************************************/

  /**
   * @dev this should be executed after the vault execute trade on OptionMarket and by keeper
   */
  function openPosition() external onlyKeeper {
      require(otusVault.vaultState.roundInProgress, "Round closed");
      require(currentStrategy.maxHedgeAttempts <= otusVault.vaultState.roundHedgeAttempts); 
      uint marginDelta; // 1 - (collateral * .85) * leverage required uint "-" is for shorts
      IFuturesMarket(futuresMarket).modifyPosition(marginDelta);
      otusVault.vaultState.roundHedgeAttempts += 1; 
      emit HedgeModifyPosition(msg.sender, marginDelta, otusVault.vaultState.roundHedgeAttempts);
  }

  /**
  * @dev called by keeper 
  * update vault collateral, call 
  */
  function closeHedge() external onlyKeeper {
      IFuturesMarket(futuresMarket).closePosition();
      // transfer all funds back to vault state
      emit HedgeClosePosition(msg.sender);
  }

}
