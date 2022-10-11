//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MockFuturesMarket {
  mapping(address => int) public fundingByAccount;

  constructor() {
    // really
  }

  function transferMargin(int marginDelta) external {
    int existingMargin = fundingByAccount[msg.sender];
    fundingByAccount[msg.sender] = existingMargin + marginDelta;
  }

  function remainingMargin(address account) external view returns (uint marginRemaining, bool invalid) {
    int _marginRemaining = fundingByAccount[account];
    invalid = false;
    return (uint(_marginRemaining), invalid);
  }

  function withdrawAllMargin() external {}

  function modifyPosition(int sizeDelta) external {}

  function closePosition() external {}
}
