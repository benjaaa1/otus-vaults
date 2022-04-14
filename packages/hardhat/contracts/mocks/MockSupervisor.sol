//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockSupervisor is ReentrancyGuardUpgradeable {

	address public immutable treasury;
	IERC20 public immutable otusAsset; 

	address public supervisor;

	constructor(address _otusTreasury, address asset) {
		treasury = _otusTreasury; 
		otusAsset = IERC20(asset); 
	}

	function initialize() external initializer {
		__ReentrancyGuard_init();
		supervisor = msg.sender;
	}
}