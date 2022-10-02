//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MockFuturesMarket {
  constructor() {
    // really
  }

  function transferMargin(int marginDelta) external {}

  function remainingMargin(address account) external view returns (uint marginRemaining, bool invalid) {}

  function withdrawAllMargin() external {}

  function modifyPosition(int sizeDelta) external {}

  function closePosition() external {}
}
