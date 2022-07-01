
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {StrategyBase} from "./vault/strategy/StrategyBase.sol";

// libraries
import {Vault} from "./libraries/Vault.sol";

interface ISupervisor {
	function initialize() external; 
}

interface IOtusVault {
	function initialize(
		address _owner,
		Vault.VaultInformation memory _vaultInfo,
		Vault.VaultParams memory _vaultParams,
		address __strategy
	) external; 
}

interface IStrategy {
	function initialize(
    address _owner, 
    address _vault, 
		address[] memory marketAddressess,
		StrategyBase.StrategyDetail memory _currentStrategy
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

contract OtusCloneFactory {
	/// @notice Stores the Otus vault contract implementation address
	address public immutable otusVault;
	/// @notice Stores the Strategy contract implementation address 
	address public immutable strategy;  
	/// @notice Stores the Strategy contract implementation address 
	address public immutable l2DepositMover;  

	address public immutable otusController;  

  /************************************************
   *  EVENTS
   ***********************************************/

	event NewVaultClone(address _clone, address _owner);
	event NewStrategyClone(address _clone, address _owner);

  /**
   * @notice Initializes the contract with immutable variables
   */
	constructor(
			address _otusVault, 
			address _strategyAddress, 
			address _l2DepositMover,
			address _otusController
		) {
			otusVault = _otusVault; 
			strategy = _strategyAddress;
			l2DepositMover =_l2DepositMover; 
			otusController = _otusController;
	}

	function cloneVault() public returns (address otusVaultClone) {
		require(msg.sender == otusController, "Not allowed to create");
		otusVaultClone = Clones.clone(otusVault);
		emit NewVaultClone(otusVaultClone, msg.sender);
	}

	function cloneStrategy() public returns (address strategyClone) {
		require(msg.sender == otusController, "Not allowed to create");
		strategyClone = Clones.clone(strategy);
		emit NewStrategyClone(strategyClone, msg.sender);
	}

	function _initializeClonedVault(
		address _otusVaultClone,
		address _owner,
		Vault.VaultInformation memory _vaultInfo,
		Vault.VaultParams memory _vaultParams,
		address __strategy
	) public {
		require(msg.sender == otusController, "Not allowed to create");
		IOtusVault(_otusVaultClone).initialize(
			_owner,
			_vaultInfo,
			_vaultParams,
			__strategy
		);

	}

  /**
   * @notice Clones strategy contract if supervisor has a vault created
   */
	function _initializeClonedStrategy(
		address _owner,
		address _vault,
		address _strategy,
		address[] memory marketAddresses,
    StrategyBase.StrategyDetail memory _currentStrategy
	 ) public {
		require(msg.sender == otusController, "Not allowed to create");
		require(marketAddresses[0] != address(0), "Failed to get quote asset");

		IStrategy(_strategy).initialize(
			_owner,
			_vault,  
			marketAddresses,
			_currentStrategy
		);

		emit NewStrategyClone(_strategy, msg.sender);
	}
}
