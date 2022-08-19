//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Vault} from "../libraries/Vault.sol";
import {StrategyBase} from "../vaultDOV/strategy/StrategyBase.sol";

interface IStrategy {
  function returnFundsAndClearStrikes() external;

  function setBoard(uint boardId) external;

  function doTrade(StrategyBase.StrikeTrade memory currentStrikeStrategy)
    external
    returns (
      uint positionId,
      uint premiumReceived,
      uint capitalUsed
    );

  function reducePosition(uint positionId, uint closeAmount) external;

  function _hedge(
    uint optionType,
    uint lockedAmountLeft,
    uint roundHedgeAttempts
  ) external;

  function _deltaHedge(uint deltaHedgeAttempts) external;

  function _staticDeltaHedge(uint deltaHedgeAttempts, int deltaToHedge) external;

  function _transferFunds(uint reservedHedgeFunds) external;

  function _closeHedge() external;

  function closeHedgeEndOfRound() external;
}
