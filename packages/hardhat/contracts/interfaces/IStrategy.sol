//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IStrategy {
  function initialize(address _owner, address _vault) external;

  function trade(bytes calldata data, uint round) external returns (uint);

  function execute(bytes calldata data) external;

  function close() external;
}
