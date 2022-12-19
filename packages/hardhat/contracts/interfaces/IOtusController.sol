//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IOtusController {
  function _getMarketContracts()
    external
    returns (
      bytes32[] memory _markets,
      address[] memory _lyraBases,
      address[] memory _futuresMarkets,
      address[] memory _lyraOptionMarkets
    );
}
