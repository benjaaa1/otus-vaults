//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Hardhat
import "hardhat/console.sol";

import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";
import {IERC20Detailed} from "../interfaces/IERC20Detailed.sol";
import {StrategyBase} from "../vault/strategy/StrategyBase.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import "../interfaces/IFuturesMarket.sol";
import "./MockOtusVault.sol";

contract MockStrategy is StrategyBase {

  IERC20Detailed public collateral;
  IERC20Detailed public premium;

  uint public tradePremiumAmount;
  uint public tradeCollateralAmount;

  uint public boardId;  

  address public vault;
  MockOtusVault public otusVault;

  constructor(
    address _synthetixAdapter
  ) StrategyBase( _synthetixAdapter) {}

  function initialize(
    address _owner, 
    address _vault, 
    address[] memory marketAddresses
  ) external {    
    
    address _quoteAsset = marketAddresses[0];  // quote asset
    address _baseAsset = marketAddresses[1];

    baseInitialize(
      _owner, 
      _vault,
      marketAddresses,
      address(0)
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