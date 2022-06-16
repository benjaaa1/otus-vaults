//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Supervisor is ReentrancyGuardUpgradeable {
  using SafeERC20 for IERC20;

	// IERC20 public immutable otusAsset; 
	address public immutable treasury;
	
	address public supervisor;

	mapping(address => uint256) deposits; 

	bool isActive; 

	/************************************************
	*  EVENTS
	***********************************************/

	event NewSupervisorStake(address owner, uint _amount);
	event NewSupervisorUnStake(address owner, uint _amount);

	modifier onlySupervisor {
		require(msg.sender == supervisor, "Only supervisor.");
		_;
	}

	/**
	* @notice Initializes the contract with immutable variables
	*/
	constructor(address _otusTreasury) {
		treasury = _otusTreasury; 
	}

	/**
	* @notice Initializes the contract with variables from user
	*/
	function initialize() external initializer {
		__ReentrancyGuard_init();
		supervisor = msg.sender;
	}

}
