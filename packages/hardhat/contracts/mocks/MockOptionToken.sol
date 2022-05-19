//SPDX-License-Identifier: ISC
pragma solidity 0.8.9;

import "hardhat/console.sol";

// Inherited
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {SynthetixAdapter} from "@lyrafinance/protocol/contracts/SynthetixAdapter.sol";
import {OptionGreekCache} from "@lyrafinance/protocol/contracts/OptionGreekCache.sol";
import {OptionMarket} from "@lyrafinance/protocol/contracts/OptionMarket.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";

/**
 * @title OptionToken
 * @author Lyra
 * @dev Provides a tokenised representation of each trade position including amount of options and collateral.
 */
contract MockOptionToken is Ownable, ERC721Enumerable {
  using DecimalMath for uint;

  enum PositionState {
    EMPTY,
    ACTIVE,
    CLOSED,
    LIQUIDATED,
    SETTLED,
    MERGED
  }

  struct OptionPosition {
    uint positionId;
    uint strikeId;
    OptionMarket.OptionType optionType;
    uint amount;
    uint collateral;
    PositionState state;
  }

  ///////////////
  // Parameters //
  ///////////////

  struct PartialCollateralParameters {
    /// @dev Meaning in english
    uint penaltyRatio; // percent of collateral used for penalty (amm + liquidator fees)
    uint liquidatorFeeRatio; // percent of penalty used for amm fees
    uint smFeeRatio; // percent of penalty used for SM fees
    uint minLiquidationFee; //quote value
  }

  ///////////////
  // Variables //
  ///////////////
  bool internal initialized = false;
  OptionMarket internal optionMarket;
  OptionGreekCache internal greekCache;
  address internal shortCollateral;
  SynthetixAdapter internal synthetixAdapter;

  mapping(uint => OptionPosition) public positions;
  uint public nextId = 1;

  PartialCollateralParameters public partialCollatParams;

  string public baseURI;

  ///////////
  // Setup //
  ///////////

  constructor(string memory name, string memory symbol) ERC721(name, symbol) ERC721Enumerable() Ownable() {}

  /**
   * @dev Initialise the contract.
   * @param _optionMarket The OptionMarket contract address.
   */
  function init(
    OptionMarket _optionMarket,
    OptionGreekCache _greekCache,
    address _shortCollateral,
    SynthetixAdapter _synthetixAdapter
  ) external {
    require(!initialized, "contract already initialized");
    optionMarket = _optionMarket;
    greekCache = _greekCache;
    shortCollateral = _shortCollateral;
    synthetixAdapter = _synthetixAdapter;
    initialized = true;
  }

  /////////////////////////
  // Adjusting positions //
  /////////////////////////

  function adjustPosition(
    OptionMarket.TradeParameters memory trade,
    uint strikeId,
    address trader,
    uint _positionId,
    uint optionCost,
    uint setCollateralTo,
    bool isOpen
  ) external onlyOptionMarket returns (uint, int pendingCollateral) {
    OptionPosition storage position;
    if (_positionId == 0) {
      require(trade.amount != 0 && isOpen, "cannot open trade of amount 0 or close position id 0");
      _positionId = nextId++;
      console.log("trader", trader); // should be supervisor - manager address
      _mint(trader, _positionId);
      console.log("trader2", trader); // should be supervisor - manager address

      position = positions[_positionId];

      position.positionId = _positionId;
      position.strikeId = strikeId;
      position.optionType = trade.optionType;
      position.state = PositionState.ACTIVE;

      emit PositionCreated(trader, position.positionId, position);
    } else {
      position = positions[_positionId];
    }

    require(position.state == PositionState.ACTIVE, "Position must be active in order to adjust");
    require(
      position.positionId != 0 && position.strikeId == strikeId && position.optionType == trade.optionType,
      "invalid positionId/strikeId/optionType"
    );
    require(trader == ownerOf(position.positionId), "adjusting position for non owner");

    if (isOpen) {
      position.amount += trade.amount;
    } else {
      position.amount -= trade.amount;
    }

    if (position.amount == 0) {
      // return all collateral to the user if they fully close the position
      pendingCollateral = -int(position.collateral);
      if (
        trade.optionType == OptionMarket.OptionType.SHORT_CALL_QUOTE ||
        trade.optionType == OptionMarket.OptionType.SHORT_PUT_QUOTE
      ) {
        // Add the optionCost to the inverted collateral (subtract from collateral)
        pendingCollateral += int(optionCost);
      }
      position.collateral = 0;
      position.state = PositionState.CLOSED;
      _burn(position.positionId); // burn tokens that have been closed.
      emit PositionUpdated(position.positionId, position);
      return (position.positionId, pendingCollateral);
    }

    if (_isShort(trade.optionType)) {
      uint preCollateral = position.collateral;
      if (trade.optionType != OptionMarket.OptionType.SHORT_CALL_BASE) {
        if (isOpen) {
          preCollateral += optionCost;
        } else {
          // This will only throw if the position is insolvent
          preCollateral -= optionCost;
        }
      }
      pendingCollateral = int(setCollateralTo) - int(preCollateral);
      position.collateral = setCollateralTo;
      require(
        !canLiquidate(position, trade.expiry, trade.strikePrice, trade.exchangeParams.spotPrice),
        "Minimum collateral not met"
      );
    }
    // if long, pendingCollateral is 0 - ignore

    emit PositionUpdated(position.positionId, position);

    return (position.positionId, pendingCollateral);
  }

  function canLiquidate(
    OptionPosition memory position,
    uint expiry,
    uint strikePrice,
    uint spotPrice
  ) public view returns (bool) {
    if (!_isShort(position.optionType)) {
      return false;
    }
    if (position.state != PositionState.ACTIVE) {
      return false;
    }

    // Option expiry is checked in optionMarket._doTrade()

    // Will revert if called post expiry
    uint minCollateral = greekCache.getMinCollateral(
      position.optionType,
      strikePrice,
      expiry,
      spotPrice,
      position.amount
    );

    return position.collateral < minCollateral;
  }

  //////////
  // Util //
  //////////

  function _isShort(OptionMarket.OptionType optionType) internal pure returns (bool shortPosition) {
    shortPosition = (uint(optionType) >= uint(OptionMarket.OptionType.SHORT_CALL_BASE)) ? true : false;
  }

  ///////////////
  // Modifiers //
  ///////////////

  modifier onlyOptionMarket() virtual {
    require(msg.sender == address(optionMarket), "only OptionMarket");
    _;
  }

  ////////////
  // Events //
  ///////////

  /**
   * @dev Emitted when a position is created.
   */
  event PositionCreated(address indexed owner, uint indexed positionId, OptionPosition position);

  /**
   * @dev Emitted when a position is updated.
   */
  event PositionUpdated(uint indexed positionId, OptionPosition position);

}
