
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Vault} from "../libraries/Vault.sol";
import {DNStrategyBase} from "../vaultDN/strategy/DNStrategyBase.sol";

interface IDNStrategy {

	function returnFunds() external;

	function doTrade() external returns (
		uint positionId,
		uint capitalUsed
	); 

}
