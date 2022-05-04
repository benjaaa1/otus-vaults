
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

import {OtusRegistry} from "../OtusRegistry.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// libraries
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

	function setStrategy(address _strategy) external; 
}

interface IStrategy {
	function initialize(
		address _vault,
    address _owner, 
		address _optionToken,
		address _optionMarket,
		address _liquidityPool,
		address _shortCollateral,
		address _futuresMarket,
    address _quoteAsset, 
    address _baseAsset
	) external; 
}

/**
 * @dev should move mapping to use 
 */

contract OtusCloneFactory is OtusRegistry {
	/// @notice Stores the Supervisor contract implementation address 
	address public immutable supervisor;
	/// @notice Stores the Otus vault contract implementation address
	address public immutable otusVault;
	/// @notice Stores the Strategy contract implementation address 
	address public immutable strategy;  
	
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
			address _strategy, 
			address _lyraMarketRegistry,
			address _futuresMarketManager
		) 
		OtusRegistry(_lyraMarketRegistry, _futuresMarketManager) {
			supervisor = _supervisor; 
			otusVault = _otusVault; 
			strategy = _strategy;
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
		address _quoteAsset, 
		address _baseAsset,
		string memory _tokenName,
		string memory _tokenSymbol,
		bool isPublic, 
		uint _vaultType,
		Vault.VaultParams memory _vaultParams
	) external {
		address userSupervisor = _getSupervisor(); 
		require(userSupervisor != address(0), "Has no supervisor"); 
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

		// register new vault 
		_addVault(otusVaultClone);

		emit NewVaultClone(otusVaultClone, msg.sender);

		address strategyClone =	_cloneStrategy(
			otusVaultClone,
			_quoteAsset, 
			_baseAsset
		);
		
		(bool success, bytes memory data) = address(otusVaultClone).delegatecall(
				abi.encodeWithSignature("setStrategy(address)", strategyClone)
		);
	}

  /**
   * @notice Clones strategy contract if supervisor has a vault created
   */
	function _cloneStrategy(
		address _vault, 
		address _quoteAsset, 
		address _baseAsset
	 ) internal returns (address strategyClone) {
		strategyClone = Clones.clone(strategy);
		strategies[_vault] = strategyClone;

		// OptionMarketAddresses memory marketAddress = getOptionMarketDetails(_baseAsset); 
		// require(marketAddress.optionToken != address(0), "Failed to get optionToken");
		// require(marketAddress.optionMarket != address(0), "Failed to get optionMarket");
		// require(marketAddress.liquidityPool != address(0), "Failed to get liquidityPool");
		// require(marketAddress.shortCollateral != address(0), "Failed to get shortCollateral");
		// require(marketAddress.futuresMarket != address(0), "Failed to get futuresMarket");

		IStrategy(strategyClone).initialize(
			msg.sender,
			_vault,  
			address(0x9e7bAAfd72965e575B284065fc8942C377879700),	// marketAddress.optionToken,
			address(0xb43285B5aF7cad80409e1267Ea21ECB44eEF4a0E),	// marketAddress.optionMarket,
			address(0xBc704C32183836fE0F64376A95ddeD20F5CF731c),	// marketAddress.liquidityPool,
			address(0xa56bE2FC5c5D204c2fCc0e5CE5FfEdf1A5749786),	// marketAddress.shortCollateral,
			address(0x698E403AaC625345C6E5fC2D0042274350bEDf78),	// marketAddress.futuresMarket,
			_quoteAsset, 
			_baseAsset
		);

		emit NewStrategyClone(strategyClone, msg.sender);
	}

}
