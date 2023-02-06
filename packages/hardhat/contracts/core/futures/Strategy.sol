pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Libraries
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import {Vault} from "../../libraries/Vault.sol";
import "../../synthetix/SignedSafeDecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";
import "../../synthetix/SignedSafeMath.sol";

// Vault
import {OtusVault} from "../OtusVault.sol";

/**
 * @title Strategy - Futures
 * @author Otus
 * @dev Executes futures strategy for vault based on strategy settings
 */
contract Strategy is BaseFuturesAdapter {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  struct StrategyDetail {
    uint stopLoss;
    // max leverage of strategy
    uint maxLeverage;
    // eth btc link
    bytes32[] allowedMarkets;
  }

  // address of vault it's strategizing for
  address public vault;
  // instance of vault it's strategizing for
  OtusVault public otusVault;

  /************************************************
   *  EVENTS
   ***********************************************/

  event StrategyUpdated(address vault, StrategyDetail updatedStrategy);

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault() {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /************************************************
   *  ERRORS
   ***********************************************/

  /// @notice market has to be allowed
  /// @param market: name of the market
  error MarketNotAllowed(bytes32 market);

  /************************************************
   *  ADMIN
   ***********************************************/

  /**
   * @notice set quote asset and controller
   * @param _quoteAsset susd - usdc
   * @param _otusController otus controller
   */
  constructor(
    address _quoteAsset,
    address _otusController
  ) StrategyBase(_quoteAsset, _otusController) {}

  /**
   * @notice Initializer strategy
   * @param _owner owner of strategy
   * @param _vault vault that owns strategy
   */
  function initialize(address _owner, address _vault) external {
    baseInitialize(_owner, _vault);
    vault = _vault;
    otusVault = OtusVault(_vault);
  }

  /************************************************
   *  STRATEGY SETTERS
   ***********************************************/

  /**
   * @notice Update the strategy for the new round
   * @param _currentStrategy vault strategy settings
   */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentStrategy = _currentStrategy;

    // after strategy is set need to update allowed markets :
    _setAllowedMarkets(currentStrategy.allowedMarkets);

    emit StrategyUpdated(address(otusVault), currentStrategy);
  }

  /******************************************************
   * VAULT ACTIONS
   *****************************************************/

  function trade(
    bytes32 _key,
    Trade memory _trade
  ) external onlyVault returns (uint allCapitalUsed) {
    // check leverage is less than max leverage allowed

    if (_trade.isIncrease == true) {
      increasePosition(_trade);
    } else {
      require(_key, "No key");
      decreasePosition(_key, _trade);
    }

    // trade details needed to make trade
    // is limit order ?
    // is long ?
    // leverage ?
    // size
    // asset
    // expiration
    // acceptable price
    // increase or reduce
    // gmx
    // - createIncreasePosition
    // - createDecreasePosition
    // snx
    // - modifyPosition (doesn't support limit orders so may need to submit to a keeper kwenta or gelota self)
    // - executeTrade(Trade memory _trade)
  }

  function execute() external onlyVault {
    // cancel order (incrase or decrease)
    // gmx
    // - cancelIncreasePosition
    // - cancelDecreasePosition
  }

  function keeper() external onlyVault {}

  function close() external onlyVault {
    closePosition();
    // send funds back to vault
    sendFundsToVault();
  }

  function sendFundsToVault() internal {
    uint quoteBal = quoteAsset.balanceOf(address(this));
    if (quoteBal > 0 && !quoteAsset.transfer(address(otusVault), quoteBal)) {
      revert QuoteTransferFailed(address(this), address(this), address(otusVault), quoteBal);
    }
    emit QuoteReturnedToLP(quoteBal);
  }
}
