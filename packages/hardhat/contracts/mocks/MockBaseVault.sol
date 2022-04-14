//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {Vault} from "../libraries/Vault.sol"; 

contract MockBaseVault is ReentrancyGuardUpgradeable {
  using SafeMath for uint;

  uint internal constant FEE_MULTIPLIER = 10**6;

  uint private roundPerYear;

	constructor(uint _roundDuration) {
		uint _roundPerYear = uint(365 days).mul(FEE_MULTIPLIER).div(_roundDuration);
		roundPerYear = _roundPerYear;
	}

	function baseInitialize(
    address _owner,
    address _supervisor,
    string memory _tokenName,
    string memory _tokenSymbol,
    Vault.VaultParams memory _vaultParams
  ) internal {}

}