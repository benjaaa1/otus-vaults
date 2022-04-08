//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

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
	function initialize(address _vault) external; 
}

contract OtusCloneFactory is Ownable {
	/// @notice Stores the Supervisor contract implementation address 
	address public supervisor;
	/// @notice Stores the Otus vault contract implementation address
	address public otusVault;
	/// @notice Stores the Strategy contract implementation address 
	address public strategy;  

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

		IStrategy(strategyClone).initialize(vaults[supervisors[msg.sender]]);

		emit NewStrategyClone(strategyClone, msg.sender);
	}

}
