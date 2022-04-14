//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20Detailed} from "../interfaces/IERC20Detailed.sol";

contract MockStrategy {
  IERC20Detailed public immutable collateral;
  IERC20Detailed public immutable premium;

  uint public tradePremiumAmount;
  uint public tradeCollateralAmount;

  uint public boardId;  

  constructor(IERC20Detailed _premiumToken, IERC20Detailed _collateralToken) {
    collateral = _collateralToken;
    premium = _premiumToken;
  }
  function initialize(address _vault) external {}
  
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