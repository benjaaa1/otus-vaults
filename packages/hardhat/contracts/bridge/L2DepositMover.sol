//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

// Hardhat
import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { OtusVault } from "../vault/OtusVault.sol"; 

contract L2DepositMover is OwnableUpgradeable {
  using SafeMath for uint;

  mapping(address => uint) public userBalance; 

  OtusVault public vault; 

  address[] public creditors; 

  constructor() {}

  function initialize(address _owner, address _vault) public initializer {
     __Ownable_init();
    transferOwnership(_owner);
    vault = OtusVault(_vault);
    // IERC20(vault.vaultParams().asset).approve(address(this), type(uint).max); 
  }

  function creditUser(address _creditor, uint256 _amount) public {
    uint currentBalance = userBalance[_creditor]; 
    userBalance[_creditor] = currentBalance.add(_amount); 

    if(currentBalance == 0) {
      creditors.push(_creditor); 
    } 
  }

  // function depositForUsers() public {
  //   address creditor;
  //   uint currentBalance;  

  //   for(uint i = 0; i < creditors.length; i++) {
  //     creditor = creditors[i]; 
  //     currentBalance = userBalance[creditor]; 
  //     if(currentBalance > 0) {
  //       vault.depositFor(currentBalance, creditor);
  //       userBalance[creditor] = 0; 
  //     }
  //   }

  // }

  function getUserBalance() public view returns (uint256) {
    return userBalance[msg.sender]; 
  }

}