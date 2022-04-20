
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
		bool isPublic, 
		uint _vaultType,
		Vault.VaultParams memory _vaultParams
	) external; 
}

interface IStrategy {
	function initialize(
		address _vault,
    address _owner, 
    address _quoteAsset, 
    address _baseAsset
	) external; 
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
	function setKeeper(address _keeper) external onlyOwner {
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

	function _getSupervisor() public view returns (address userSupervisor) {
		require(supervisors[msg.sender] != address(0), "Has no supervisor");
		userSupervisor = supervisors[msg.sender];
	}

  	/**
   	* @notice clones OtusVault contract 
	* @dev add check if supervisor has staked OTUS can create vault
   	*/
	function _cloneVault(
		string memory _tokenName,
		string memory _tokenSymbol,
		bool isPublic, 
		uint _vaultType,
		Vault.VaultParams memory _vaultParams
	) external {
		address userSupervisor = _getSupervisor(); 
		address otusVaultClone = Clones.clone(otusVault);
		vaults[userSupervisor] = otusVaultClone;

		IOtusVault(otusVaultClone).initialize(
			msg.sender,
			supervisors[msg.sender], 
			_tokenName, 
			_tokenSymbol,
			isPublic, 
			_vaultType,
			_vaultParams
		);

		emit NewVaultClone(otusVaultClone, msg.sender);
	}

	function _getVault() public view returns (address userVault) {
		address userSupervisor = _getSupervisor(); 
		require(vaults[userSupervisor] != address(0), "Has no vault");
		userVault = vaults[userSupervisor]; 
	}

  /**
   * @notice Clones strategy contract if supervisor has a vault created
   */
	function _cloneStrategy(address _quoteAsset, address _baseAsset) external {
		address vault = _getVault(); 
		address strategyClone = Clones.clone(strategy);
		strategies[vault] = strategyClone;
		IStrategy(strategyClone).initialize(vaults[supervisors[msg.sender]], msg.sender, _quoteAsset, _baseAsset);
		emit NewStrategyClone(strategyClone, msg.sender);
	}

	function _getStrategy() public view returns (address userStrategy) {
		address userVault = _getVault(); 
		require(strategies[userVault] != address(0), "Has no strategy");
		userStrategy = strategies[userVault]; 
	}

}
