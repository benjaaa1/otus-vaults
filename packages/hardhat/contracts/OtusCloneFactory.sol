
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {OtusRegistry} from "./OtusRegistry.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strategy} from "./vault/strategy/Strategy.sol";

// libraries
import {Vault} from "./libraries/Vault.sol";

interface ISupervisor {
	function initialize() external; 
}

interface IOtusVault {
	function initialize(
		address _owner,
		address _feeRecipient,
		string[] memory _vaultInfo,
		bool isPublic, 
		Vault.VaultParams memory _vaultParams,
		address __strategy
	) external; 

	function setStrategy(address _strategy) external; 
}

interface IStrategy {
	function initialize(
    address _owner, 
    address _vault, 
		address[] memory marketAddressess,
    address _gwavOracle
	) external; 
}

interface IL2DepositMover {
	function initialize(
    address _owner, 
    address _vault
	) external; 
}

/**
 * @dev should move mapping to use 
 */

contract OtusCloneFactory is OtusRegistry {
  // Strategy public _strategy; // for delegate call 
	/// @notice Stores the Supervisor contract implementation address 
	address public immutable supervisor;
	/// @notice Stores the Otus vault contract implementation address
	address public immutable otusVault;
	/// @notice Stores the Strategy contract implementation address 
	address public immutable strategy;  
	/// @notice Stores the Strategy contract implementation address 
	address public immutable l2DepositMover;  
  /************************************************
   *  EVENTS
   ***********************************************/

	event NewSupervisorClone(address _clone, address _owner);
	event NewVaultClone(address _clone, address _owner);
	event NewStrategyClone(address _clone, address _owner);

  /**
   * @notice Initializes the contract with immutable variables
   */
	constructor(
			address _supervisor, 
			address _otusVault, 
			address _strategyAddress, 
			address _l2DepositMover,
			address _lyraMarketRegistry,
			address _futuresMarketManager
		) 
		OtusRegistry(_lyraMarketRegistry, _futuresMarketManager) {
			supervisor = _supervisor; 
			otusVault = _otusVault; 
			strategy = _strategyAddress;
			l2DepositMover =_l2DepositMover; 
	}

	/**
	* @notice clones supervisor contract
	*/
	function cloneSupervisor() external {
		address supervisorClone = Clones.clone(supervisor);
		supervisors[msg.sender] = supervisorClone;
		supervisorsList.push(supervisorClone);
		ISupervisor(supervisorClone).initialize();
		emit NewSupervisorClone(supervisorClone, msg.sender); 
	}

  /**
  * @notice clones OtusVault contract 
	* @dev add check if supervisor has staked OTUS can create vault
  */
	function cloneVaultWithStrategy(
		address _optionMarket,
		string[] memory _vaultInfo,
		bool isPublic,
		Vault.VaultParams memory _vaultParams
	) external {

		address userSupervisor = _getSupervisor(); 
		require(userSupervisor != address(0), "Has no supervisor"); 

		address otusVaultClone = Clones.clone(otusVault);
		vaults[userSupervisor] = otusVaultClone;

		require(otusVaultClone != address(0), "Vault not created"); 
		// register new vault 
		_addVault(otusVaultClone);

		address	strategyClone = Clones.clone(strategy);
		strategies[otusVaultClone] = strategyClone;

		require(strategyClone != address(0), "Strategy not created"); 
		console.log("_vaultParams.asset clone", _vaultParams.asset);
		IOtusVault(otusVaultClone).initialize(
			msg.sender,
			userSupervisor, 
			_vaultInfo,
			isPublic, 
			_vaultParams,
			strategyClone
		);

		_initializeClonedStrategy(
			otusVaultClone,
			_optionMarket,
			strategyClone
		);
		
		emit NewVaultClone(otusVaultClone, msg.sender);

		// (bool success, bytes memory result) = otusVaultClone.delegatecall(abi.encodeWithSelector(OtusVault.setVars.setStrategy, strategyClone)));

		// require(success, "Strategy not set"); 
	}

  /**
   * @notice Clones strategy contract if supervisor has a vault created
   */
	function _initializeClonedStrategy(
		address _vault, 
		address _optionMarket,
		address _strategy
	 ) internal {

		address[] memory marketAddresses = getOptionMarketDetails(_optionMarket); 
		require(marketAddresses[0] != address(0), "Failed to get quote asset");

		IStrategy(_strategy).initialize(
			msg.sender,
			_vault,  
			marketAddresses,
			address(0x806b9d822013B8F82cC8763DCC556674853905d5)  // marketAddress.gwavOracle
			//address(0x4A679253410272dd5232B3Ff7cF5dbB88f295319)
		);

		emit NewStrategyClone(_strategy, msg.sender);
	}

	function _cloneL2DepositMover(address _vault) external {
		address l2DepositMoverClone = Clones.clone(l2DepositMover);
		require(l2DepositMoverClone != address(0), "Deposit clone not created"); 
		vaultBridge[_vault] = l2DepositMoverClone; 
		IL2DepositMover(l2DepositMoverClone).initialize(
			msg.sender,
			_vault
		);
	}

}
