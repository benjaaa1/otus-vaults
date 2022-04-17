//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

// Hardhat
import "hardhat/console.sol";

import {GWAVOracle} from "@lyrafinance/core/contracts/periphery/GWAVOracle.sol";
import {DecimalMath} from "@lyrafinance/core/contracts/synthetix/DecimalMath.sol";
import {SignedDecimalMath} from "@lyrafinance/core/contracts/synthetix/SignedDecimalMath.sol";

import {VaultAdapter} from '@lyrafinance/core/contracts/periphery/VaultAdapter.sol';
import {Strategy} from "./Strategy.sol"; 
// use this for interactions with kwenta (futures adapter)
contract OtusAdapter is VaultAdapter {
  using DecimalMath for uint;
	using SignedDecimalMath for int;

  GWAVOracle public immutable gwavOracle;
  address public strategy; 

	constructor(
		GWAVOracle _gwavOracle,
		address _curveSwap,
    address _optionToken,
    address _optionMarket,
    address _liquidityPool,
    address _shortCollateral,
    address _synthetixAdapter,
    address _optionPricer,
    address _greekCache,
    address _quoteAsset,
    address _baseAsset,
    address _feeCounter
	) {
    gwavOracle = _gwavOracle;
		setLyraAddresses(
      _curveSwap,
      _optionToken,
      _optionMarket,
      _liquidityPool,
      _shortCollateral,
      _synthetixAdapter,
      _optionPricer,
      _greekCache,
      _quoteAsset,
      _baseAsset,
      _feeCounter
    );
	}

	/**
  * @dev set the board id that will be traded for the next round
  */
  function setBoard(uint boardId, Strategy.Detail calldata currentStrategy) public view returns (uint activeExpiry) {
    Board memory board = getBoard(boardId);
    require(_isValidExpiry(
      board.expiry, 
      currentStrategy.minTimeToExpiry, 
      currentStrategy.maxTimeToExpiry
    ), "invalid board");
    activeExpiry = board.expiry;
  }

	/**
   * @dev calculate required collateral to add in the next trade.
   * sell size is fixed as currentStrategy.size
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   */
  function _getRequiredCollateral(
			OptionType tradeOptionType,
			Strike memory strike, 
			Strategy.Detail memory currentStrategy,
			uint positionId,
			bool isActiveStrike
		)
    public
    view
    returns (uint collateralToAdd, uint setCollateralTo)
  {
    uint sellAmount = currentStrategy.size;
    ExchangeRateParams memory exchangeParams = getExchangeParams();

    // get existing position info if active
    uint existingAmount = 0;
    uint existingCollateral = 0;
    if (isActiveStrike) {
      OptionPosition memory position = getPositions(
        _toDynamic(positionId)
      )[0];
      existingCollateral = position.collateral;
      existingAmount = position.amount;
    }

    // gets minBufferCollat for the whole position
    uint minBufferCollateral = _getBufferCollateral(
			tradeOptionType,
      strike.strikePrice,
      strike.expiry,
      exchangeParams.spotPrice,
      existingAmount + sellAmount,
      currentStrategy.collatBuffer
    );

    // get targetCollat for this trade instance
    // prevents vault from adding excess collat just to meet targetCollat
    uint targetCollat = existingCollateral + _getFullCollateral(tradeOptionType, strike.strikePrice, sellAmount).multiplyDecimal(currentStrategy.collatPercent);
    console.log("targetCollat", targetCollat);
    // if excess collateral, keep in position to encourage more option selling
    setCollateralTo = _max(_max(minBufferCollateral, targetCollat), existingCollateral);

    // existingCollateral is never > setCollateralTo
    collateralToAdd = setCollateralTo - existingCollateral;
  }

	/************************************************
   *  VALIDATION
   ***********************************************/
  /**
   * @dev verify if the strike is valid for the strategy
   * @return isValid true if vol is withint [minVol, maxVol] and delta is within targetDelta +- maxDeltaGap
   */
  function isValidStrike(
			Strike memory strike, 
			Strategy.Detail memory currentStrategy, 
			uint activeExpiry,
			OptionType tradeOptionType
		) public view returns (bool isValid) {
    if (activeExpiry != strike.expiry) {
      return false;
    }

    uint[] memory strikeId = _toDynamic(strike.id);
    uint vol = getVols(strikeId)[0];
    console.log("vol", vol); 
    int callDelta = getDeltas(strikeId)[0];
    console.log("callDelta", uint(callDelta)); 
    console.log("_isCall(tradeOptionType)", _isCall(tradeOptionType));
    int delta = _isCall(tradeOptionType) ? callDelta : callDelta - SignedDecimalMath.UNIT;
    console.log("delta", uint(delta)); 
    uint deltaGap = _abs(currentStrategy.targetDelta - delta);
    console.log("deltaGap", deltaGap);
    console.log("currentStrategy.maxDeltaGap", currentStrategy.maxDeltaGap); 
    console.log(vol >= currentStrategy.minVol && vol <= currentStrategy.maxVol);
    console.log(deltaGap < currentStrategy.maxDeltaGap);

    return vol >= currentStrategy.minVol && vol <= currentStrategy.maxVol && deltaGap < currentStrategy.maxDeltaGap;
  }

  /**
   * @dev check if the vol variance for the given strike is within certain range
   */
  function _isValidVolVariance(uint strikeId, uint maxVolVariance, uint gwavPeriod) public view returns (bool isValid) {
    uint volGWAV = gwavOracle.volGWAV(strikeId, gwavPeriod);
    uint volSpot = getVols(_toDynamic(strikeId))[0];

    uint volDiff = (volGWAV >= volSpot) ? volGWAV - volSpot : volSpot - volGWAV;

    return isValid = volDiff < maxVolVariance;
  }

  /**
   * @dev check if the expiry of the board is valid according to the strategy
   */
  function _isValidExpiry(uint expiry, uint minTimeToExpiry, uint maxTimeToExpiry) public view returns (bool isValid) {
    uint secondsToExpiry = _getSecondsToExpiry(expiry);
    isValid = (secondsToExpiry >= minTimeToExpiry &&
      secondsToExpiry <= maxTimeToExpiry);
  }

  /************************************************
   *  TRADE PARAMETER HELPERS
   ***********************************************/

  function _getFullCollateral(OptionType tradeOptionType, uint strikePrice, uint amount) public view returns (uint fullCollat) {
    // calculate required collat based on collatBuffer and collatPercent
    fullCollat = _isBaseCollat(tradeOptionType) ? amount : amount.multiplyDecimal(strikePrice);
  }

  /**
   * @dev get amount of collateral needed for shorting {amount} of strike, according to the strategy
   */
  function _getBufferCollateral(
		OptionType tradeOptionType,
    uint strikePrice,
    uint expiry,
    uint spotPrice,
    uint amount,
		uint collatBuffer
  ) public view returns (uint) {
    uint minCollat = getMinCollateral(tradeOptionType, strikePrice, expiry, spotPrice, amount);
    uint minCollatWithBuffer = minCollat.multiplyDecimal(collatBuffer);

    uint fullCollat = _getFullCollateral(tradeOptionType, strikePrice, amount);
    console.log("fullCollat", fullCollat, amount, strikePrice);
    return _min(minCollatWithBuffer, fullCollat);
  }

  /**
   * @dev get minimum premium that the vault should receive.
   * param listingId lyra option listing id
   * param size size of trade in Lyra standard sizes
   */
  function _getPremiumLimit(
			Strike memory strike, 
			bool isMin, 
			Strategy.Detail memory currentStrategy,
			OptionType tradeOptionType
		) public view returns (uint limitPremium) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint limitVol = isMin ? currentStrategy.minVol : currentStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = getPurePremium(
      _getSecondsToExpiry(strike.expiry),
      limitVol,
      exchangeParams.spotPrice,
      strike.strikePrice
    );

    limitPremium = _isCall(tradeOptionType)
      ? minCallPremium.multiplyDecimal(currentStrategy.size)
      : minPutPremium.multiplyDecimal(currentStrategy.size);
  }

	/************************************************
   *  EXPOSED
   ***********************************************/
	function _getExchangeParams() public view returns (ExchangeRateParams memory params) {
		params = getExchangeParams();
	}

	function _exchangeFromExactBase(uint amountBase, uint minQuoteReceived) public returns (uint quoteReceived) {
		quoteReceived = exchangeFromExactBase(amountBase, minQuoteReceived); 
	}

	function _openPosition(TradeInputParameters memory params) public returns (TradeResult memory result) {
    // console.log("_openPosition", msg.sender); 

    // (bool success, bytes memory data) = _market.delegatecall(
    //     abi.encodeWithSignature("openPosition(VaultAdapter.TradeInputParameters)", params)
    // );
    // console.log("success", success); 
    // result = abi.decode(data, (VaultAdapter.TradeResult)); 

    result = openPosition(params); 
	} 

	function _closePosition(TradeInputParameters memory params) public returns (TradeResult memory result) {
		result = closePosition(params); 
	}

	function _getPositions(uint[] memory positionIds) public view returns (OptionPosition[] memory positions) {
		for (uint i = 0; i < positionIds.length; i++) {
			OptionPosition memory position = getPositions(
				_toDynamic(positionIds[i])
			)[0];
			positions[i] = position; 
		}

		return positions; 
	}

	function _getStrikes(uint[] memory strikeIds) public view returns (Strike[] memory allStrikes) {
		allStrikes = getStrikes(strikeIds); 
	}

  /************************************************
   *  MISC
   ***********************************************/
  
  function test() external pure returns (string memory t) {
    t = "test";
  }

  function _isBaseCollat(OptionType tradeOptionType) public view returns (bool isBase) {
    console.log("_isBaseCollat"); 
    isBase = (tradeOptionType == OptionType.SHORT_CALL_BASE) ? true : false;
  }

  function _isCall(OptionType tradeOptionType) public pure returns (bool isCall) {
    isCall = (tradeOptionType == OptionType.SHORT_PUT_QUOTE) ? false : true;
  }

  function _getSecondsToExpiry(uint expiry) internal view returns (uint) {
    require(block.timestamp <= expiry, "timestamp expired");
    return expiry - block.timestamp;
  }

  function _abs(int val) internal pure returns (uint) {
    return val >= 0 ? uint(val) : uint(-val);
  }

  function _min(uint x, uint y) internal pure returns (uint) {
    return (x < y) ? x : y;
  }

  function _max(uint x, uint y) internal pure returns (uint) {
    return (x > y) ? x : y;
  }

  // temporary fix - eth core devs promised Q2 2022 fix
  function _toDynamic(uint val) internal pure returns (uint[] memory dynamicArray) {
    dynamicArray = new uint[](1);
    dynamicArray[0] = val;
  }

}