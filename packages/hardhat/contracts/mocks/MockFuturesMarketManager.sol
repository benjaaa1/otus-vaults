//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MockFuturesMarketManager {

  mapping(bytes32 => address) public marketForKey;
  constructor() {}

  function addMarket(bytes32 synth, address market) public {
    marketForKey[synth] = market; 
  }
  
}