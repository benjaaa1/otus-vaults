//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";

// Libraries
import '../../synthetix/SignedSafeDecimalMath.sol';
import '../../synthetix/SafeDecimalMath.sol';
import '../../synthetix/SignedSafeMath.sol';

// Vault 
import {Vault} from "../../libraries/Vault.sol";
import {OtusVault} from "../OtusVault.sol";
import {StrategyBase} from "./StrategyBase.sol";

contract Strategy is StrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  IERC20 public collateralAsset; 

  address public vault;

  OtusVault public otusVault;
  
  /************************************************
   *  EVENTS
   ***********************************************/

  event HedgeClosePosition(address closer);

  event HedgeModifyPosition(address closer, uint marginDelta, uint256 hedgeAttempt);


  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /************************************************
   *  ADMIN
   ***********************************************/

  constructor(address _synthetixAdapter) StrategyBase(_synthetixAdapter) {}

  function initialize(
    address _owner, 
    address _vault, 
    address[] memory marketAddresses,
    StrategyDetail memory _currentStrategy
  ) external { 

    baseInitialize(
      _owner, 
      _vault,
      marketAddresses,
      _currentStrategy
    ); 

    vault = _vault;
    otusVault = OtusVault(_vault); 
    collateralAsset = IERC20(marketAddresses[0]);
  }

  /************************************************
  *  SETTERS
  ***********************************************/

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  * quoteAsset usually USD baseAsset usually ETH
  */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress,) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentStrategy = _currentStrategy;
  }

  function setHedgeStrategy(
      HedgeDetail memory _hedgeStrategy
    ) external onlyOwner {
    (, , , , , , , bool roundInProgress,) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentHedgeStrategy = _hedgeStrategy; 
  }

  function getCurrentStrikeStrategies() public view returns (StrikeStrategyDetail[] memory) {
    return currentStrikeStrategies; 
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
   * @dev set the board id that will be traded for the next round
   * @param boardId lyra board Id.
   */
  function setBoard(uint boardId) external {
    require(boardId > 0, "Board Id incorrect");
    Board memory board = getBoard(boardId);
    require(_isValidExpiry(board.expiry), "invalid board");
    activeExpiry = board.expiry;
    activeBoardId = boardId; 
  }

  /**
  * @notice sell a fix aomunt of options and collect premium
  * @dev the vault should pass in a strike id, and the strategy would verify if the strike is valid on-chain.
  * @param currentStrikeStrategy lyra strikeId to trade
  * @return positionId
  * @return premiumReceived
  * @return capitalUsed
  */
  function doTrade(StrikeStrategyDetail memory currentStrikeStrategy) external onlyVault returns (
      uint positionId,
      uint premiumReceived,
      uint capitalUsed
    )
  {
    uint index = activeStrikeIds.length; 
    uint strikeId = currentStrikeStrategy.strikeId;
    uint size = currentStrikeStrategy.size;
    uint optionType = currentStrikeStrategy.optionType;
    require(
      validateTimeIntervalByOptionType(strikeId, optionType),
      "min time interval not passed for option type"
    );

    require(_isValidVolVariance(strikeId, currentStrikeStrategy), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike, currentStrikeStrategy), "invalid strike");

    if(_isLong(currentStrikeStrategy.optionType)) {
      uint maxPremium = _getPremiumLimit(strike, false, currentStrikeStrategy);

      require(
        collateralAsset.transferFrom(address(vault), address(this), maxPremium),
        "collateral transfer from vault failed"
      );

      (positionId, premiumReceived) = _buyStrike(strike, size, currentStrikeStrategy, index, maxPremium);

      capitalUsed = maxPremium; 
    } else {
      (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(strike, size, optionType);

      require(
        collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
        "collateral transfer from vault failed"
      );

      (positionId, premiumReceived) = _sellStrike(strike, size, setCollateralTo, currentStrikeStrategy, index);

      capitalUsed = collateralToAdd;
    }

    currentStrikeStrategies.push(StrikeStrategyDetail(
      currentStrikeStrategy.targetDelta,
      currentStrikeStrategy.maxDeltaGap,
      currentStrikeStrategy.minVol,
      currentStrikeStrategy.maxVol,
      currentStrikeStrategy.maxVolVariance,
      currentStrikeStrategy.optionType,
      currentStrikeStrategy.strikeId,
      currentStrikeStrategy.size
    ));
  }

  
  /**
   * @dev convert premium in quote asset into collateral asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint quoteBal = quoteAsset.balanceOf(address(this));

    StrikeStrategyDetail memory currentStrikeStrategy; 

    bool hasBaseCollat = false; 
    bool hasQuoteCollat = false; 

    for(uint i = 0; i < currentStrikeStrategies.length; i++) {
      currentStrikeStrategy = currentStrikeStrategies[i]; 

      // base asset might not be needed if we only use usd 
      if (_isBaseCollat(currentStrikeStrategy.optionType)) {
        hasBaseCollat = true; 
      } else {
        hasQuoteCollat = true; 
      }

    }
    
    if(hasBaseCollat) {
      // exchange quote asset to base asset, and send base asset back to vault
      uint baseBal = baseAsset.balanceOf(address(this));
      uint minQuoteExpected = quoteBal.divideDecimal(exchangeParams.spotPrice).multiplyDecimal(
        DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate
      );
      uint baseReceived = exchangeFromExactQuote(quoteBal, minQuoteExpected);
      require(baseAsset.transfer(address(vault), baseBal + baseReceived), "failed to return funds from strategy");
    }

    if(hasQuoteCollat) {
      // send quote balance directly
      require(quoteAsset.transfer(address(vault), quoteBal), "failed to return funds from strategy");
    }

    _clearAllActiveStrikes();
  }

  /**
   * @dev calculate required collateral to add in the next trade.
   * sell size is fixed as currentStrategy.size
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   */
  function getRequiredCollateral(Strike memory strike, uint _size, uint _optionType)
    public
    view
    returns (uint collateralToAdd, uint setCollateralTo)
  {
    uint sellAmount = _size;
    ExchangeRateParams memory exchangeParams = getExchangeParams();

    // get existing position info if active
    uint existingAmount = 0;
    uint existingCollateral = 0;
    if (_isActiveStrike(strike.id)) {
      OptionPosition memory position = getPositions(_toDynamic(strikeToPositionId[strike.id]))[0];
      existingCollateral = position.collateral;
      existingAmount = position.amount;
    }

    // gets minBufferCollat for the whole position
    uint minBufferCollateral = _getBufferCollateral(
      strike.strikePrice,
      strike.expiry,
      exchangeParams.spotPrice,
      existingAmount + sellAmount,
      _optionType
    );

    // get targetCollat for this trade instance
    // prevents vault from adding excess collat just to meet targetCollat
    uint targetCollat = existingCollateral + _getFullCollateral(strike.strikePrice, sellAmount, _optionType).multiplyDecimal(currentStrategy.collatPercent);

    // if excess collateral, keep in position to encourage more option selling
    setCollateralTo = _max(_max(minBufferCollateral, targetCollat), existingCollateral);

    // existingCollateral is never > setCollateralTo
    collateralToAdd = setCollateralTo - existingCollateral;

  }

  /**
   * @dev perform the trade
   * @param strike strike detail
   * @param _size target collateral amount
   * @param setCollateralTo target collateral amount
   * @param currentStrikeStrategy target collateral amount
   * @param strategyIndex target collateral amount
   * @return positionId
   * @return premiumReceived
   */
  function _sellStrike(
    Strike memory strike,
    uint _size, 
    uint setCollateralTo,
    StrikeStrategyDetail memory currentStrikeStrategy,
    uint strategyIndex
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    uint minExpectedPremium = _getPremiumLimit(strike, true, currentStrikeStrategy);
    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    // perform trade
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: optionType,
        amount: _size, // size should be different depending on strategy 
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType + 1;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  //   /**
  //  * @dev perform the trade
  //  * @param strike strike detail
  //  * @param maxPremium max premium willing to spend for this trade
  //  * @param lyraRewardRecipient address to receive lyra trading reward
  //  * @return positionId
  //  * @return premiumReceived
  //  */
  function _buyStrike(
    Strike memory strike,
    uint _size, 
    StrikeStrategyDetail memory currentStrikeStrategy,
    uint strategyIndex,
    uint maxPremium
  ) internal returns (uint, uint) {

    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    // perform trade to long
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: optionType,
        amount: _size,
        setCollateralTo: 0,
        minTotalCost: 0,
        maxTotalCost: maxPremium,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType + 1;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

    require(result.totalCost <= maxPremium, "premium too high");

    return (result.positionId, result.totalCost);
  }


  /**
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   */
  function reducePosition(
    uint positionId,
    uint closeAmount
  ) external onlyVault {
    OptionPosition memory position = getPositions(_toDynamic(positionId))[0];
    Strike memory strike = getStrikes(_toDynamic(position.strikeId))[0];
    require(strikeToPositionId[position.strikeId] == positionId, "invalid positionId");

    // only allows closing if collat < minBuffer
    require(
      closeAmount <= getAllowedCloseAmount(position, strike.strikePrice, strike.expiry, uint(position.optionType)),
      "amount exceeds allowed close amount"
    );

    uint currentStrikeStrategyIndex = strategyToStrikeId[position.strikeId];
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[currentStrikeStrategyIndex]; 

    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(strike, false, currentStrikeStrategy);
    TradeInputParameters memory tradeParams = TradeInputParameters({
      strikeId: position.strikeId,
      positionId: position.positionId,
      iterations: 3,
      optionType: position.optionType,
      amount: closeAmount,
      setCollateralTo: position.collateral,
      minTotalCost: type(uint).min,
      maxTotalCost: maxExpectedPremium,
      rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
    });

    TradeResult memory result;
    if (!_isOutsideDeltaCutoff(strike.id)) {
      result = closePosition(tradeParams);
    } else {
      // will pay less competitive price to close position
      result = forceClosePosition(tradeParams);
    }

    require(result.totalCost <= maxExpectedPremium, "premium paid is above max expected premium");

    // return closed collateral amount
    if (_isBaseCollat(uint(position.optionType))) {
      uint currentBal = baseAsset.balanceOf(address(this));
      baseAsset.transfer(address(vault), currentBal);
    } else {
      // quote collateral
      quoteAsset.transfer(address(vault), closeAmount);
    }
  }

  /**
   * @dev calculates the position amount required to stay above the buffer collateral
   */
  function getAllowedCloseAmount(
    OptionPosition memory position,
    uint strikePrice,
    uint strikeExpiry,
    uint _optionType
  ) public view returns (uint closeAmount) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint minCollatPerAmount = _getBufferCollateral(strikePrice, strikeExpiry, exchangeParams.spotPrice, 1e18, _optionType);

    closeAmount = position.collateral < minCollatPerAmount.multiplyDecimal(position.amount)
      ? position.amount - position.collateral.divideDecimal(minCollatPerAmount)
      : 0;
  }

  /************************************************
   *  KEEPER ACTIONS -  HEDGE
   ***********************************************/

  function _hedge(bool activeShort, uint lockedAmountLeft, uint roundHedgeAttempts) external onlyVault  {
    require(!activeShort, "Active futures hedge");
    require(currentHedgeStrategy.maxHedgeAttempts <= roundHedgeAttempts); 
    // through kwenta
    if(roundHedgeAttempts == 0) { // first time hedging
      require(
        // need to use kwenta / synthetix susd collateralAssetTest
        IERC20(0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57).transferFrom(address(vault), address(this), lockedAmountLeft),
        "susd transfer to from vault failed"
      );

      _transferMargin(int(lockedAmountLeft)); 
    }

    // check current hedge balance in synthetix 
    (uint marginRemaining, bool invalid) = _remainingMargin(); 
    require(marginRemaining > 0, "Remaining margin is 0");

    uint spotPrice = synthetixAdapter.getSpotPriceForMarket(address(optionMarket));
    uint size = (marginRemaining.multiplyDecimal(currentHedgeStrategy.leverageSize)).divideDecimal(spotPrice);

    _modifyPosition(-int(size)); 
  } 

  function _closeHedge(bool activeShort) external onlyVault  {
    require(activeShort, "No active futures hedge");
    (,, uint128 margin, uint128 lastPrice, int128 size) = _positions(); 
    _closePosition();
    activeShort = false; 
  }

  function closeHedgeEndOfRound() public {
    _withdrawAllMargin(); 
  }

}
