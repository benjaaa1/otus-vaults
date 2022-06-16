
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Vault} from "../libraries/Vault.sol";
import {StrategyBase} from "../vault/strategy/StrategyBase.sol";

interface IStrategy {

	function returnFundsAndClearStrikes() external;

	function setBoard(uint boardId) external; 

	function doTrade(
		StrategyBase.StrikeStrategyDetail memory currentStrikeStrategy
	) external returns (
		uint positionId,
		uint premiumReceived,
		uint capitalUsed
	); 

	function reducePosition(
		uint positionId,
    uint closeAmount
	) external; 

	function _hedge(bool activeShort, uint lockedAmountLeft, uint roundHedgeAttempts) external; 

 	function _closeHedge(bool activeShort) external; 

}
