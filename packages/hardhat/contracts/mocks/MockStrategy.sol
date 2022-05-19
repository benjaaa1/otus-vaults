//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Hardhat
import "hardhat/console.sol";

import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";
import {IERC20Detailed} from "../interfaces/IERC20Detailed.sol";
import {VaultAdapter} from "../VaultAdapter.sol";
import {FuturesAdapter} from "../FuturesAdapter.sol";
import {TokenAdapter} from "../TokenAdapter.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import "../interfaces/IFuturesMarket.sol";
import "./MockOtusVault.sol";

contract MockStrategy is FuturesAdapter, VaultAdapter, TokenAdapter {
  GWAVOracle public gwavOracle;

  IERC20Detailed public collateral;
  IERC20Detailed public premium;

  uint public tradePremiumAmount;
  uint public tradeCollateralAmount;

  uint public boardId;  

  address public vault;
  MockOtusVault public otusVault;

  constructor(
    address _synthetixAdapter
  ) FuturesAdapter() VaultAdapter( _synthetixAdapter) {}

  function initialize(
    address _owner, 
    address _vault, 
    address _optionToken,
    address _optionMarket,
    address _liquidityPool,
    address _shortCollateral,
    address _optionPricer,
    address _greekCache,
    address _futuresMarket,
    address _quoteAsset, 
    address _baseAsset
  ) external {    
    
    optionInitialize(
      _optionToken,
      _optionMarket,
      _liquidityPool,
      _shortCollateral,
      _optionPricer,
      _greekCache
    );

    futuresInitialize(_futuresMarket);

    baseInitialize(
      _owner, 
      _vault,
      _futuresMarket, 
      _optionMarket, 
      _quoteAsset, 
      _baseAsset
    );

    vault = _vault;
    otusVault = MockOtusVault(_vault); 

    collateral = IERC20Detailed(_baseAsset);
    premium = IERC20Detailed(_quoteAsset);
  }
  
  function setBoard(uint _boardId) public {
    boardId = _boardId;
  }

  function setMockedTradeAmount(uint _premium, uint _collateral) public {
    tradePremiumAmount = _premium;
    tradeCollateralAmount = _collateral;
  }

  function returnFundsAndClearStrikes() external {
    // return collateral and premium to msg.sender
    uint colBalance = collateral.balanceOf(address(this));
    collateral.transfer(msg.sender, colBalance);

    uint premiumBalance = premium.balanceOf(address(this));
    premium.transfer(msg.sender, premiumBalance);
  }
}