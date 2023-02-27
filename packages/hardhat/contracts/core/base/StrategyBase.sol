//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

// interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interfaces/IOtusController.sol";

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Vault
import {OtusVault} from "../OtusVault.sol";

/**
 * @title StrategyBase
 * @dev Maintains vault and controller addresses
 */
abstract contract StrategyBase is OwnableUpgradeable {
  /************************************************
   *  State
   ***********************************************/
  // otus controller
  IOtusController internal immutable otusController;

  // address of vault it's strategizing for
  address public vault;
  // instance of vault it's strategizing for
  OtusVault public otusVault;

  // store allowed markets can be updated
  mapping(bytes32 => bool) public allowedMarkets;

  constructor(address _otusController) {
    otusController = IOtusController(_otusController);
  }

  /************************************************
   *  EVENTS
   ***********************************************/
  event QuoteReturnedToLP(uint _quoteBal);

  event OrderFilled(address _thrower, uint _orderId, uint _premium, uint _fee);

  /************************************************
   *  ERRORS
   ***********************************************/
  error TransferNotImplemented(address thrower, uint _amount);

  error QuoteTransferFailed(address _strategy, address _vault, uint _quoteBal);

  error InsufficientEthBalance(uint _balance, uint _amount);

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault() {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /**
   * @dev
   * @param _owner _owner address
   * @param _vault _vault address
   */
  function baseInitialize(address _owner, address _vault) internal initializer {
    vault = _vault;
    otusVault = OtusVault(_vault);
    __Ownable_init();
    transferOwnership(_owner);
  }

  /************************************************
   *  Market Setters
   ***********************************************/
  /**
   * @dev On init and strategy update / update markets allowed
   */
  function _setAllowedMarkets(bytes32[] memory managerAllowedMarkets) internal {
    // delete allowedMarkets mapping;

    uint len = managerAllowedMarkets.length;

    for (uint i = 0; i < len; i++) {
      bytes32 key = managerAllowedMarkets[i];
      allowedMarkets[key] = true;
    }
  }

  /************************************************
   *  Vault Transfer
   ***********************************************/

  /**
   * @notice transfer from vault
   * @param _amount quote amount to transfer
   */
  function _trasferFromVault(uint _amount) internal virtual onlyVault {
    revert TransferNotImplemented(address(this), _amount);
  }

  /**
   * @notice transfer all funds to vault
   */
  function _trasferFundsToVault(uint _amount) internal virtual {
    revert TransferNotImplemented(address(this), _amount);
  }
}
