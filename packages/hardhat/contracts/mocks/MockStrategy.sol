//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Hardhat
import "hardhat/console.sol";

import {GWAVOracle} from "@lyrafinance/core/contracts/periphery/GWAVOracle.sol";
import {IERC20Detailed} from "../interfaces/IERC20Detailed.sol";
import {VaultAdapter} from "../VaultAdapter.sol";
// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DecimalMath} from "@lyrafinance/core/contracts/synthetix/DecimalMath.sol";
import "../interfaces/IFuturesMarket.sol";
import "./MockOtusVault.sol";

contract MockStrategy is VaultAdapter {
  GWAVOracle public immutable gwavOracle;

  IERC20Detailed public collateral;
  IERC20Detailed public premium;

  uint public tradePremiumAmount;
  uint public tradeCollateralAmount;

  uint public boardId;  

  address public vault;
  address public futuresMarket;
  MockOtusVault public otusVault;

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
    address _feeCounter
  ) VaultAdapter(
    _curveSwap,
    _optionToken,
    _optionMarket,
    _liquidityPool,
    _shortCollateral,
    _synthetixAdapter,
    _optionPricer,
    _greekCache,
    _feeCounter
  ) {
    gwavOracle = _gwavOracle;
  }

  function initialize(
    address _vault, 
    address _owner, 
    address _quoteAsset, 
    address _baseAsset
  ) external {    
    baseInitialize(
      _owner, 
      _quoteAsset, 
      _baseAsset
    );
    vault = _vault;
    otusVault = MockOtusVault(_vault); 
    futuresMarket = otusVault.futuresMarket(); // future kwenta adapter --> vaultadapter

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