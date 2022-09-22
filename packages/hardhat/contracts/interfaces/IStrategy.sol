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
      uint capitalUsed,
      uint expiry,
      uint strikePrice
    );

  function reducePosition(uint positionId, uint closeAmount) external;

  function getVaultStrategy() external returns (StrategyBase.StrategyDetail memory currentStrategy);

  function _simpleHedge(int size) external;

  function _dynamicDeltaHedge(int deltaToHedge, uint deltaHedgeAttempts) external;

  function _staticDeltaHedge(int deltaToHedge) external;

  function _transferFunds(uint reservedHedgeFunds) external;

  function _closeHedge() external;

  function _closeHedgeEndOfRound() external;

  function transferToFuturesMarket(int hedgeFunds) external;
}
