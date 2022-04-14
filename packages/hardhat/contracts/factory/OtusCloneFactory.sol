//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Vault} from "../libraries/Vault.sol";

interface ISupervisor {
	function initialize() external; 
}

interface IOtusVault {
	function initialize(
		address _owner,
		address _feeRecipient,
		string memory _tokenName,
		string memory _tokenSymbol,
		Vault.VaultParams memory _vaultParams
	) external; 
}

interface IStrategy {
	function owner() external view returns (address); 
	function initialize(address _vault, address _owner) external; 
}

contract OtusCloneFactory is Ownable {
	/// @notice Stores the Supervisor contract implementation address 
	address public immutable supervisor;
	/// @notice Stores the Otus vault contract implementation address
	address public immutable otusVault;
	/// @notice Stores the Strategy contract implementation address 
	address public immutable strategy;  

	address public keeper;  

	// msg.sender => supervisor
	mapping(address => address) public supervisors;
	// supervisor =>  vault
	mapping(address => address) public vaults; 
	// vault =>  strategy
	mapping(address => address) public strategies;
	
  /************************************************
   *  EVENTS
   ***********************************************/

	event NewSupervisorClone(address _clone, address _owner);
	event NewVaultClone(address _clone, address _owner);
	event NewStrategyClone(address _clone, address _owner);

  /**
   * @notice Initializes the contract with immutable variables
   */
	constructor(address _supervisor, address _otusVault, address _strategy) {
		supervisor = _supervisor; 
		otusVault = _otusVault; 
		strategy = _strategy; 
	}

	/**
	* @notice Set keeper
	*/
	function setKeeper(address _keeper) external {
		keeper = _keeper; 
	} 

	/**
	* @notice clones supervisor contract
	*/
	function _cloneSupervisor() external {
		address supervisorClone = Clones.clone(supervisor);
		supervisors[msg.sender] = supervisorClone;
		ISupervisor(supervisorClone).initialize();
		emit NewSupervisorClone(supervisorClone, msg.sender); 
	}

  	/**
   	* @notice clones OtusVault contract 
	* @dev add check if supervisor has staked OTUS can create vault
   	*/
	function _cloneVault(
		string memory _tokenName,
		string memory _tokenSymbol,
		Vault.VaultParams memory _vaultParams
	) external {
		address otusVaultClone = Clones.clone(otusVault);
		require(supervisors[msg.sender] != address(0), "Needs a supervisor");
		vaults[supervisors[msg.sender]] = otusVaultClone;

		IOtusVault(otusVaultClone).initialize(
			msg.sender,
			supervisors[msg.sender], 
			_tokenName, 
			_tokenSymbol,
			_vaultParams
		);

		emit NewVaultClone(otusVaultClone, msg.sender);
	}

  /**
   * @notice Clones strategy contract if supervisor has a vault created
   */
	function _cloneStrategy() external {
		address strategyClone = Clones.clone(strategy);
		require(supervisors[msg.sender] != address(0), "Needs a supervisor");
		require(vaults[supervisors[msg.sender]] != address(0), "Needs a vault");
		strategies[vaults[supervisors[msg.sender]]] = strategyClone;

		console.log("strategyClone", strategyClone);
		console.log("vaults[supervisors[msg.sender]]", vaults[supervisors[msg.sender]]);

		address owner0 = IStrategy(strategy).owner(); 
		address owner = IStrategy(strategyClone).owner(); 
		console.log("strategy 0 current owner", owner0); 
		console.log("strategy clone current owner", owner); 
		console.log("owner i want to be", msg.sender); 

		IStrategy(strategyClone).initialize(vaults[supervisors[msg.sender]], msg.sender);

		address owner1 = IStrategy(strategyClone).owner();
		console.log("strategy 1 current owner", owner1); 

		emit NewStrategyClone(strategyClone, msg.sender);
	}

}


// Vault adapters can include kwenta connections
// Vault adapters have a quoteAsset and a baseAsset
// Example quoteAsset ~ USD baseAsset ~ BTC
// Multiple strategies can share the same quote and base vault adapters 
// for now deploy vault adapter for each strategy, vaultadapter has otusmultisig as original owner
// in clone factory 
// 