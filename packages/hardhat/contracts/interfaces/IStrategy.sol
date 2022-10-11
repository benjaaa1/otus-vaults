//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Vault} from "../libraries/Vault.sol";
import {StrategyBase} from "../vaultDOV/strategy/StrategyBase.sol";

interface IStrategy {
  function returnFundsAndClearStrikes() external;

  // function setBoard(uint boardId) external;

  function doTrade(StrategyBase.StrikeTrade memory currentStrikeStrategy)
    external
    returns (
      uint positionId,
      uint premiumReceived,
      uint capitalUsed,
      uint expiry
    );

  function reducePosition(
    bytes32 market,
    uint positionId,
    uint closeAmount
  ) external;

  function getVaultStrategy() external returns (StrategyBase.StrategyDetail memory currentStrategy);

  function _simpleHedge(int size) external;

  function _dynamicDeltaHedge(int deltaToHedge, uint deltaHedgeAttempts) external;

  function _staticDeltaHedge(
    bytes32 market,
    int deltaToHedge,
    uint positionId
  ) external;

  function _transferFunds(uint reservedHedgeFunds) external;

  function _closeHedge() external;

  function _closeHedgeEndOfRound() external;

  function transferToFuturesMarket(bytes32 market, int hedgeFunds) external;

  function initialize(
    bytes32[] memory lyraAdapterKeys,
    address[] memory lyraAdapterValues,
    address[] memory lyraOptionMarkets,
    address[] memory futuresMarkets,
    address _owner,
    address _vault,
    StrategyBase.StrategyDetail memory _currentStrategy
  ) external;
}
