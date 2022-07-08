//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {OtusController} from "../OtusController.sol"; 

interface IOtusVault {
	function reducePosition(uint positionId, uint closeAmount) external; 
  function hedge(uint optionType) external; 
	function closeHedge(uint optionType) external; 

}

contract Keeper is Ownable {
  using Address for address;

  OtusController immutable public otusController;

  struct Position {
    address otusVault;
    uint positionId;
    uint amount;
  }

  struct HedgeTrade {
    address otusVault;
    uint optionType;
  }

  constructor(address _otusController) Ownable() {
    otusController = OtusController(_otusController);
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

  function openHedgePosition(HedgeTrade[] memory newHedgeTrades) external onlyOwner {
    
    for(uint i = 0; i < newHedgeTrades.length; i++) {
      bytes memory data = abi.encodeWithSelector(
        IOtusVault.hedge.selector,
        newHedgeTrades[i].optionType
      );
      callOptionalReturn(newHedgeTrades[i].otusVault, data);
    }

  }
    
  function closeHedgePosition(HedgeTrade[] memory newHedgeTrades) external onlyOwner {
    
    for(uint i = 0; i < newHedgeTrades.length; i++) {
      bytes memory data = abi.encodeWithSelector(
        IOtusVault.closeHedge.selector,
        newHedgeTrades[i].optionType
      );
      callOptionalReturn(newHedgeTrades[i].otusVault, data);
    }

  }

  function callOptionalReturn(address otusVault, bytes memory data) private {

    bytes memory returndata = otusVault.functionCall(data, "OtusVault: Low level call Failed");
    if (returndata.length > 0) {
        // Return data is optional
        require(abi.decode(returndata, (bool)), "OtusVault: Operation did not succeed");
    }

  }
}