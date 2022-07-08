//SPDX-License-Identifier: ISC
pragma solidity 0.8.9;

// Libraries
import {LiquidityPool} from "@lyrafinance/protocol/contracts/LiquidityPool.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Interfaces
import {ISynthetix} from "../interfaces/ISynthetix.sol";
import {IAddressResolver} from "../interfaces/IAddressResolver.sol";
import {IExchanger} from "../interfaces/IExchanger.sol";
import {IExchangeRates} from "../interfaces/IExchangeRates.sol";
import {IDelegateApprovals} from "../interfaces/IDelegateApprovals.sol";

/**
 * @title ExchangeAdapter
 * @author Lyra 
 * @dev Manages access to exchange functions on Synthetix.
 */
contract ExchangeAdapter is OwnableUpgradeable {
  using DecimalMath for uint;

  /**
   * @dev Structs to help reduce the number of calls between other contracts and this one
   * Grouped in usage for a particular contract/use case
   */
  struct ExchangeParams {
    // snx oracle exchange rate for base
    uint spotPrice;
    // snx quote asset identifier key
    bytes32 quoteKey;
    // snx base asset identifier key
    bytes32 baseKey;
    // snx spot exchange rate from quote to base
    uint quoteBaseFeeRate;
    // snx spot exchange rate from base to quote
    uint baseQuoteFeeRate;
  }

  /// @dev Pause the whole system. Note; this will not pause settling previously expired options.
  mapping(address => bool) public isMarketPaused;

  IAddressResolver public addressResolver;

  bytes32 private constant CONTRACT_SYNTHETIX = "ProxySynthetix";
  bytes32 private constant CONTRACT_EXCHANGER = "Exchanger";
  bytes32 private constant CONTRACT_EXCHANGE_RATES = "ExchangeRates";
  bytes32 private constant CONTRACT_DELEGATE_APPROVALS = "DelegateApprovals";

  // Cached addresses that can be updated via a public function
  ISynthetix public synthetix;
  IExchanger public exchanger;
  IExchangeRates public exchangeRates;
  IDelegateApprovals public delegateApprovals;

  // Variables related to calculating premium/fees
  bytes32 public quoteKey;
  bytes32 public baseKey;
  address public rewardAddress;
  bytes32 public trackingCode;

  function initialize() external initializer {
    __Ownable_init();
  }

  /////////////
  // Setters //
  /////////////

  /**
   * @dev Set the address of the Synthetix address resolver.
   *
   * @param _addressResolver The address of Synthetix's AddressResolver.
   */
  function setAddressResolver(IAddressResolver _addressResolver) external onlyOwner {
    addressResolver = _addressResolver;
    updateSynthetixAddresses();
    emit AddressResolverSet(addressResolver);
  }

  //////////////////////
  // Address Resolver //
  //////////////////////

  /**
   * @dev Public function to update synthetix addresses Lyra uses. The addresses are cached this way for gas efficiency.
   */
  function updateSynthetixAddresses() public {
    synthetix = ISynthetix(addressResolver.getAddress(CONTRACT_SYNTHETIX));
    exchanger = IExchanger(addressResolver.getAddress(CONTRACT_EXCHANGER));
    exchangeRates = IExchangeRates(addressResolver.getAddress(CONTRACT_EXCHANGE_RATES));
    delegateApprovals = IDelegateApprovals(addressResolver.getAddress(CONTRACT_DELEGATE_APPROVALS));

    emit SynthetixAddressesUpdated(synthetix, exchanger, exchangeRates, delegateApprovals);
  }

  /////////////
  // Getters //
  /////////////

  /**
   * @notice Gets spot price of an asset.
   * @dev All rates are denominated in terms of sUSD,
   * so the price of sUSD is always $1.00, and is never stale.
   *
   * @param to The key of the synthetic asset.
   */
  function getSpotPrice(bytes32 to) public view returns (uint) {
    (uint spotPrice, bool invalid) = exchangeRates.rateAndInvalid(to);
    if (spotPrice == 0 || invalid) {
      revert RateIsInvalid(address(this), spotPrice, invalid);
    }
    return spotPrice;
  }

  /**
   * @notice Returns the ExchangeParams.
   * @param quoteKey quote key usually susd.
   * @param baseKey base key usually eth/btc/sol.
   */
  function getExchangeParams(bytes32 quoteKey, bytes32 baseKey)
    public
    view
    returns (ExchangeParams memory exchangeParams)
  {
    exchangeParams = ExchangeParams({
      spotPrice: 0,
      quoteKey: quoteKey,
      baseKey: baseKey,
      quoteBaseFeeRate: 0,
      baseQuoteFeeRate: 0
    });

    exchangeParams.spotPrice = getSpotPrice(exchangeParams.baseKey);
    exchangeParams.quoteBaseFeeRate = exchanger.feeRateForExchange(exchangeParams.quoteKey, exchangeParams.baseKey);
    exchangeParams.baseQuoteFeeRate = exchanger.feeRateForExchange(exchangeParams.baseKey, exchangeParams.quoteKey);
  }

  /////////////////////////////////////////
  // Exchanging QuoteAsset for BaseAsset //
  /////////////////////////////////////////

  /**
   * @notice Swap quote for base with a limit on the amount of quote to be spent.
   *
   * @param exchangeParams The current exchange rates for the swap
   * @param quoteKey The quote asset to receive
   * @param baseKey The base asset to receive
   * @param amountBase The exact amount of base to receive from the swap
   * @param quoteLimit The maximum amount of quote to spend for base
   * @return quoteSpent The amount of quote spent on the swap
   * @return baseReceived The amount of baes received from the swap
   */
  function exchangeToExactBaseWithLimit(
    ExchangeParams memory exchangeParams,
    bytes32 quoteKey, 
    bytes32 baseKey,
    uint amountBase,
    uint quoteLimit
  ) public returns (uint quoteSpent, uint baseReceived) {
    uint quoteToSpend = estimateExchangeToExactBase(exchangeParams, amountBase);
    if (quoteToSpend > quoteLimit) {
      revert QuoteBaseExchangeExceedsLimit(
        address(this),
        amountBase,
        quoteToSpend,
        quoteLimit,
        exchangeParams.spotPrice,
        exchangeParams.quoteKey,
        exchangeParams.baseKey
      );
    }

    return (quoteToSpend, _exchangeQuoteForBase(quoteKey, baseKey, quoteToSpend));
  }

  function _exchangeQuoteForBase(bytes32 quoteKey, bytes32 baseKey, uint amountQuote) internal returns (uint baseReceived) {
    if (amountQuote == 0) {
      return 0;
    }
    baseReceived = synthetix.exchangeOnBehalfWithTracking(
      msg.sender,
      quoteKey,
      amountQuote,
      baseKey,
      rewardAddress,
      trackingCode
    );
    if (amountQuote > 1e10 && baseReceived == 0) {
      revert ReceivedZeroFromExchange(
        address(this),
        quoteKey,
        baseKey,
        amountQuote,
        baseReceived
      );
    }
    emit QuoteSwappedForBase(msg.sender, amountQuote, baseReceived);
    return baseReceived;
  }

  /**
   * @notice Returns an estimated amount of quote required to swap for the specified amount of base.
   *
   * @param exchangeParams The current exchange rates for the swap
   * @param amountBase The amount of base to receive
   * @return quoteNeeded The amount of quote required to received the amount of base requested
   */
  function estimateExchangeToExactBase(ExchangeParams memory exchangeParams, uint amountBase)
    public
    pure
    returns (uint quoteNeeded)
  {
    return
      amountBase.divideDecimalRound(DecimalMath.UNIT - exchangeParams.quoteBaseFeeRate).multiplyDecimalRound(
        exchangeParams.spotPrice
      );
  }

  /////////////////////////////////////////
  // Exchanging BaseAsset for QuoteAsset //
  /////////////////////////////////////////
  /**
   * @notice Swap base for an exact amount of quote with a limit on the amount of base to be used
   *
   * @param exchangeParams The current exchange rates for the swap
   * @param quoteKey The quote asset to receive
   * @param baseKey The base asset to receive
   * @param amountQuote The exact amount of quote to receive
   * @param baseLimit The limit on the amount of base to be used
   * @return baseSpent The amount of base spent on the swap
   * @return quoteReceived The amount of quote received from the swap
   */
  function exchangeToExactQuoteWithLimit(
    ExchangeParams memory exchangeParams,
    bytes32 baseKey, 
    bytes32 quoteKey,
    uint amountQuote,
    uint baseLimit
  ) public returns (uint baseSpent, uint quoteReceived) {
    uint baseToSpend = estimateExchangeToExactQuote(exchangeParams, amountQuote);
    if (baseToSpend > baseLimit) {
      revert BaseQuoteExchangeExceedsLimit(
        address(this),
        amountQuote,
        baseToSpend,
        baseLimit,
        exchangeParams.spotPrice,
        exchangeParams.baseKey,
        exchangeParams.quoteKey
      );
    }

    return (baseToSpend, _exchangeBaseForQuote(baseKey, quoteKey, baseToSpend));
  }

  function _exchangeBaseForQuote(bytes32 baseKey, bytes32 quoteKey, uint amountBase) internal returns (uint quoteReceived) {
    if (amountBase == 0) {
      return 0;
    }
    // swap exactly `amountBase` baseAsset for quoteAsset
    quoteReceived = synthetix.exchangeOnBehalfWithTracking(
      msg.sender,
      baseKey,
      amountBase,
      quoteKey,
      rewardAddress,
      trackingCode
    );
    if (amountBase > 1e10 && quoteReceived == 0) {
      revert ReceivedZeroFromExchange(
        address(this),
        baseKey,
        quoteKey,
        amountBase,
        quoteReceived
      );
    }
    emit BaseSwappedForQuote(msg.sender, amountBase, quoteReceived);
    return quoteReceived;
  }

  /**
   * @notice Returns an estimated amount of base required to swap for the amount of quote
   *
   * @param exchangeParams The current exchange rates for the swap
   * @param amountQuote The amount of quote to swap to
   * @return baseNeeded The amount of base required for the swap
   */
  function estimateExchangeToExactQuote(ExchangeParams memory exchangeParams, uint amountQuote)
    public
    pure
    returns (uint baseNeeded)
  {
    return
      amountQuote.divideDecimalRound(DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate).divideDecimalRound(
        exchangeParams.spotPrice
      );
  }

  ////////////
  // Events //
  ////////////

  /**
   * @dev Emitted when the address resolver is set.
   */
  event AddressResolverSet(IAddressResolver addressResolver);
  /**
   * @dev Emitted when synthetix contracts are updated.
   */
  event SynthetixAddressesUpdated(
    ISynthetix synthetix,
    IExchanger exchanger,
    IExchangeRates exchangeRates,
    IDelegateApprovals delegateApprovals
  );

  /**
   * @dev Emitted when GlobalPause.
   */
  event GlobalPausedSet(bool isPaused);
  /**
   * @dev Emitted when single market paused.
   */
  event MarketPausedSet(address contractAddress, bool isPaused);
  /**
   * @dev Emitted when an exchange for base to quote occurs.
   * Which base and quote were swapped can be determined by the given marketAddress.
   */
  event BaseSwappedForQuote(
    address indexed exchanger,
    uint baseSwapped,
    uint quoteReceived
  );
  /**
   * @dev Emitted when an exchange for quote to base occurs.
   * Which base and quote were swapped can be determined by exchanger.
   */
  event QuoteSwappedForBase(
    address indexed exchanger,
    uint quoteSwapped,
    uint baseReceived
  );

  ////////////
  // Errors //
  ////////////
  // Admin
  error InvalidRewardAddress(address thrower, address rewardAddress);

  // Market Paused
  error AllMarketsPaused(address thrower, address marketAddress);
  error MarketIsPaused(address thrower, address marketAddress);

  // Exchanging
  error ReceivedZeroFromExchange(
    address thrower,
    bytes32 fromKey,
    bytes32 toKey,
    uint amountSwapped,
    uint amountReceived
  );
  error QuoteBaseExchangeExceedsLimit(
    address thrower,
    uint amountBaseRequested,
    uint quoteToSpend,
    uint quoteLimit,
    uint spotPrice,
    bytes32 quoteKey,
    bytes32 baseKey
  );
  error BaseQuoteExchangeExceedsLimit(
    address thrower,
    uint amountQuoteRequested,
    uint baseToSpend,
    uint baseLimit,
    uint spotPrice,
    bytes32 baseKey,
    bytes32 quoteKey
  );
  error RateIsInvalid(address thrower, uint spotPrice, bool invalid);
}
