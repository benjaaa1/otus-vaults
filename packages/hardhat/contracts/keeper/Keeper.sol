//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import {OtusManager} from "../OtusManager.sol"; 
import {OtusVault} from "../OtusVault.sol"; 

contract Keeper is Ownable {

  OtusManager immutable public otusmanager;

  constructor(address _otusManager) Ownable() {
    otusmanager = OtusManager(_otusManager);
  }

  function invokeContracts(string calldata _functionName, address[] calldata contracts) external onlyOwner {
    OtusVault otusVault; 
    bool succes; 
    for(uint i = 0; i < contracts.length; i++) {
      (succes, ) = contracts[i].call(
          abi.encodeWithSignature(_functionName)
      );
    }
  }

}