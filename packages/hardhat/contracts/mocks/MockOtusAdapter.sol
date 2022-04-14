//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {GWAVOracle} from "@lyrafinance/core/contracts/periphery/GWAVOracle.sol";
import {VaultAdapter} from '@lyrafinance/core/contracts/periphery/VaultAdapter.sol';

contract MockOtusAdapter is VaultAdapter {

  GWAVOracle public immutable gwavOracle;

	constructor(
		GWAVOracle _gwavOracle,
		address _curveSwap,
		address _optionToken,
		address _optionMarket,
		address _liquidityPool,
		address _shortCollateral,
		address _synthetixAdapter,
		address _optionPricer,
		address _greekCache,
		address _quoteAsset,
		address _baseAsset,
		address _feeCounter
	) {
    gwavOracle = _gwavOracle;

		setLyraAddresses(
      _curveSwap,
      _optionToken,
      _optionMarket,
      _liquidityPool,
      _shortCollateral,
      _synthetixAdapter,
      _optionPricer,
      _greekCache,
      _quoteAsset,
      _baseAsset,
      _feeCounter
    );
	}

}