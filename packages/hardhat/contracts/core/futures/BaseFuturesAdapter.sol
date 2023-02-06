//SPDX-License-Identifier: ISC
pragma solidity 0.8.9;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title BaseFuturesAdapter
 * @author Otus
 * @dev Base contract for managing access to futures functions.
 */
abstract contract BaseFuturesAdapter is OwnableUpgradeable {
  // errors

  error NotImplemented(address thrower);

  error InsufficientEthBalance(uint balance, uint minimum);

  function _initialize(address _owner) internal initializer {
    __Ownable_init();
    transferOwnership(_owner);
  }

  function increasePosition() external virtual {
    revert NotImplemented(address(this));
  }

  function decreasePosition() external virtual {
    revert NotImplemented(address(this));
  }

  function cancelPosition() external virtual {
    revert NotImplemented(address(this));
  }

  function closePosition() external virtual {
    revert NotImplemented(address(this));
  }
}
