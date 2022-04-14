//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {MockBaseVault} from  "./MockBaseVault.sol";
import {Vault} from "../libraries/Vault.sol"; 

contract MockOtusVault is MockBaseVault {
  // IFuturesMarket public immutable futuresMarket;
  address public immutable futuresMarket;
  address public supervisor; 

	constructor(address _futuresMarket, uint _roundDuration) MockBaseVault(_roundDuration) {
    futuresMarket = _futuresMarket;
	}

  function initialize(
    address _owner,
    address _supervisor, 
    string memory _tokenName,
    string memory _tokenSymbol,
    Vault.VaultParams memory _vaultParams
  ) external initializer {

    supervisor = _supervisor; 
    baseInitialize(
      _owner,
      _supervisor, 
      _tokenName, 
      _tokenSymbol, 
      _vaultParams
    ); 

  }

}