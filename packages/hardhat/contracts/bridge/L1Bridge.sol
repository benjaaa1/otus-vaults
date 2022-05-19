//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

// Hardhat
import "hardhat/console.sol";

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IL1CrossDomainMessenger } from "./ovm/IL1CrossDomainMessenger.sol"; 
interface IHopAmm {
  function sendToL2(
    uint256 chainId,
    address recipient,
    uint256 amount,
    uint256 amountOutMin,
    uint256 deadline,
    address relayer,
    uint256 relayerFee
  ) external;
}

contract L1Bridge {
  using SafeMath for uint;
  using SafeERC20 for IERC20;

  IHopAmm public immutable hopAmm; 
  IL1CrossDomainMessenger public immutable ovmL1CrossDomainMessenger; 
  address public immutable l2DepositMover; 

  constructor(
      address _hopAmm, 
      address _l1CrossDomainMessenger, 
      address _l2DepositMover
    ) {
    hopAmm = IHopAmm(_hopAmm); 
    ovmL1CrossDomainMessenger = IL1CrossDomainMessenger(_l1CrossDomainMessenger); 
    l2DepositMover = _l2DepositMover; 
  }

  //deposit to vault contract in context of user not contract
  function deposit(
    address _vault, 
    address _bridge,
    uint256 _amount, 
    uint _tokenIndex, 
    address _token, 
    uint _slippage, 
    uint _chainId
  ) external returns (address) {
    require(_vault != address(0), "Vault address not set"); 
    require(_bridge!= address(0), "No bridge for vault"); 

    IERC20(_token).safeTransferFrom(msg.sender, address(this), 11000);
    IERC20(_token).safeIncreaseAllowance(address(hopAmm), 11000);
    uint256 deadline = block.timestamp + 15 minutes; 

    hopAmm.sendToL2(
      69, // optimism kovan
      _bridge, 
      11000, 
      10900,
      deadline,
      address(0), 
      0
    );

    ovmL1CrossDomainMessenger.sendMessage(
      _bridge,
      abi.encodeWithSignature(
          "creditUser(address,uint256)",
          msg.sender, 11000
      ),
      1000000 // use whatever gas limit you want
    );

  }

}