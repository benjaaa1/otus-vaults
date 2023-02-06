//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IStrategy {
  function initialize(address _owner, address _vault) external;

  function trade(address _strategy, bytes calldata data) external;

  function execute(bytes calldata data) external;

  function keeper(address _strategy, bytes calldata data) external;

  function close() external;
}
