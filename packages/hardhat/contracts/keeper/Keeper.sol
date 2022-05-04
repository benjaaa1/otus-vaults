//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {OtusRegistry} from "../OtusRegistry.sol"; 

interface IOtusVault {
	function reducePosition(uint positionId, uint closeAmount) external; 
}

contract Keeper is Ownable {
  using Address for address;

  OtusRegistry immutable public otusRegistry;

  struct Position {
    address otusVault;
    uint positionId;
    uint amount;
  }

  struct HedgePosition {
    address otusVault;
    uint positionId;
    uint amount;
  }

  constructor(address _otusRegistry) Ownable() {
    otusRegistry = OtusRegistry(_otusRegistry);
  }

  function reducePosition(Position[] memory vaultPositions) external onlyOwner {

    for(uint i = 0; i < vaultPositions.length; i++) {
      bytes memory data = abi.encodeWithSelector(
        IOtusVault.reducePosition.selector, 
        vaultPositions[i].positionId, 
        vaultPositions[i].amount
      );

      callOptionalReturn(vaultPositions[i].otusVault, data);
    }
  }

  //openHedgePosition
  //closeHedge

  // function openHedgePosition(HedgePosition[] memory newHedgePositions) external {
    
  //   for(uint i = 0; i < newHedgePositions.length; i++) {
  //     bytes memory data = abi.encodeWithSelector(
  //       IOtusVault.reducePosition.selector, 
  //       newHedgePositions[i].positionId, 
  //       newHedgePositions[i].amount
  //     );

  //     callOptionalReturn(newHedgePositions[i].otusVault, data);
  //   }

  // }

  function callOptionalReturn(address otusVault, bytes memory data) private {

    bytes memory returndata = otusVault.functionCall(data, "OtusVault: Low level call Failed");
    if (returndata.length > 0) {
        // Return data is optional
        require(abi.decode(returndata, (bool)), "OtusVault: Operation did not succeed");
    }

  }
}