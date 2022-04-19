//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import {IFuturesMarketManager} from "./interfaces/IFuturesMarketManager.sol"; 

contract OtusManager is Ownable {

  mapping(address => bool) public vaultsStatus;
  address immutable public futuresMarketManager;

  mapping(string => bytes32) public allowedMarkets; 
  mapping(bytes32 => address) public allowedFuturesMarkets; 

  constructor(address _futuresMarketManager) Ownable() {
    futuresMarketManager = _futuresMarketManager;
  }

  /**
  * @dev Sets status of cloned vaults
  * @param _vault address of otus vault for keeper to use
  *  @param _isActive bool status of vault 
  */
  function setVaultStatus(address _vault, bool _isActive) public onlyOwner {
    vaultsStatus[_vault] = _isActive; 
  }

  /**
  * @dev Sets markets available for vaults
  * @param _market bytes32 of synthetix asset name
  */
  function setAllowedMarket(bytes32 _market, string calldata _synthName) external onlyOwner {
    allowedMarkets[_synthName] = _market; 
    require(
      IFuturesMarketManager(futuresMarketManager).marketForKey(_market) != address(0), 
      "No market for key"
    );
    allowedFuturesMarkets[_market] = IFuturesMarketManager(futuresMarketManager).marketForKey(_market);
  }

  /**
  * @dev Gets markets available for vaults
  * @param _synthName string name of synth ~ sBTC sETH 
  */
  function getAllowedFuturesMarket(string calldata _synthName) external view returns (address) {
    require(allowedMarkets[_synthName] != "", "Market not allowed");
    bytes32 _market = allowedMarkets[_synthName];
    require(allowedFuturesMarkets[_market] != address(0), "No market for key"); 
    return allowedFuturesMarkets[_market];
  }


}