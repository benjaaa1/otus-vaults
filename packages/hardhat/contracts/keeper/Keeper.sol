//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface IOtusVault {
	function reducePosition(uint positionId, uint closeAmount) external; 
  function hedge(uint optionType) external; 
	function closeHedge(uint optionType) external; 
}

contract Keeper is Ownable {
  using Address for address;

  struct Position {
    address otusVault;
    uint positionId;
    uint amount;
  }

  struct HedgeTrade {
    address otusVault;
    uint optionType;
  }

  constructor() Ownable() {}

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
    
  function closeHedgePosition(HedgeTrade[] memory newHedgeTrades) external onlyOwner returns (uint) {
    
    // for(uint i = 0; i < newHedgeTrades.length; i++) {
    //   bytes memory data = abi.encodeWithSelector(
    //     IOtusVault.closeHedge.selector,
    //     newHedgeTrades[i].optionType
    //   );
    //   callOptionalReturn(newHedgeTrades[i].otusVault, data);
    // }

    return newHedgeTrades[0].optionType;

  }

  function callOptionalReturn(address otusVault, bytes memory data) private {

    (bool success, bytes memory returndata) = otusVault.call(data);
    require(success, "OtusVault: Operation did not succeed");

  }
}