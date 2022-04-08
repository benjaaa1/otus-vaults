//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract sUSD is ERC20 {
    constructor(uint256 totalSupply) ERC20("Synthetic USD", "sUSD"){
        _mint(msg.sender, totalSupply);
    }
}