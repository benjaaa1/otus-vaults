// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ISynthetix} from "../interfaces/ISynthetix.sol";
import {ISynth} from "../interfaces/ISynth.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract MockSynthetix is ISynthetix {
  mapping(bytes32 => address) private addressMap;

  mapping(address => uint) private mockedTradeAmount;

  constructor() {
    // really
  }

  function setMockedKeyToAddress(bytes32 _key, address _address) external {
    addressMap[_key] = _address;
  }

  function setMockedTradeAmount(address _outToken, uint _outAmount) external {
    mockedTradeAmount[_outToken] = _outAmount;
  }

  function exchange(
    bytes32 sourceCurrencyKey,
    uint sourceAmount,
    bytes32 destinationCurrencyKey
  ) external override returns (uint amountReceived) {
    // pull source currency
    IERC20(addressMap[sourceCurrencyKey]).transferFrom(msg.sender, address(this), sourceAmount);

    // pay destination currency
    address destinationCurrency = addressMap[destinationCurrencyKey];
    amountReceived = mockedTradeAmount[destinationCurrency];
    IERC20(destinationCurrency).transfer(msg.sender, amountReceived);
  }

  function exchangeOnBehalf(
    address exchangeForAddress,
    bytes32 sourceCurrencyKey,
    uint sourceAmount,
    bytes32 destinationCurrencyKey
  ) external override returns (uint amountReceived) {
    // pull source currency
    IERC20(addressMap[sourceCurrencyKey]).transferFrom(exchangeForAddress, address(this), sourceAmount);

    // pay destination currency
    address destinationCurrency = addressMap[destinationCurrencyKey];
    amountReceived = mockedTradeAmount[destinationCurrency];
    IERC20(destinationCurrency).transfer(exchangeForAddress, amountReceived);
  }

  function anySynthOrSNXRateIsInvalid() external view returns (bool anyRateInvalid) {}

  function availableCurrencyKeys() external view returns (bytes32[] memory) {}

  function availableSynthCount() external view returns (uint) {}

  function availableSynths(uint index) external view returns (ISynth) {}

  function burnSecondary(address account, uint amount) external {}

  function burnSynths(uint amount) external {}

  function burnSynthsOnBehalf(address burnForAddress, uint amount) external {}

  function burnSynthsToTarget() external{}

  function burnSynthsToTargetOnBehalf(address burnForAddress) external {}

  function collateral(address account) external view returns (uint) {}

	function collateralisationRatio(address issuer) external view returns (uint) {}

	function debtBalanceOf(address issuer, bytes32 currencyKey) external view returns (uint) {}

	function remainingIssuableSynths(address issuer)
		external
			view
			returns (
					uint maxIssuable,
					uint alreadyIssued,
					uint totalSystemDebt
			) {}

	function settle(bytes32 currencyKey)
		external
		returns (
				uint reclaimed,
				uint refunded,
				uint numEntries
		) {}

  function mintSecondaryRewards(uint amount) external {}

	function mintSecondary(address account, uint amount) external {}

	function mint() external returns (bool) {}

	function maxIssuableSynths(address issuer) external view returns (uint maxIssuable) {}

	function liquidateDelinquentAccount(address account, uint susdAmount) external returns (bool) {}

	function issueMaxSynthsOnBehalf(address issueForAddress) external {}

	function issueSynths(uint amount) external {}

	function issueSynthsOnBehalf(address issueForAddress, uint amount) external {}

	function synths(bytes32 currencyKey) external view returns (ISynth) {}

	function synthsByAddress(address synthAddress) external view returns (bytes32) {}

	function totalIssuedSynthsExcludeOtherCollateral(bytes32 currencyKey) external view returns (uint) {}

	function transferableSynthetix(address account) external view returns (uint transferable) {}
}