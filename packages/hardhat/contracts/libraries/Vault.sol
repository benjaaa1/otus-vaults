// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

library Vault {
  /************************************************
   *  IMMUTABLES & CONSTANTS
   ***********************************************/

  // Fees are 6-decimal places. For example: 20 * 10**6 = 20%
  uint internal constant FEE_MULTIPLIER = 10 ** 6;

  uint internal constant ROUND_DELAY = 1 days;

  struct VaultInformation {
    // name set by manager
    string name; // can move to otus vault
    string tokenName; // can move to otus vault
    string tokenSymbol; // can move to otus vault
    string description; // can move to otus vault
    bool isPublic; // can move to otus vault
    uint performanceFee; // can move to otus vault
  }

  struct VaultParams {
    // Token decimals for vault shares
    uint8 decimals;
    // Vault cap
    uint104 cap;
    // Asset used
    address asset;
  }

  struct VaultState {
    // 32 byte slot 1
    //  Current round number. `round` represents the number of `period`s elapsed.
    uint16 round;
    // Amount that is currently locked for selling options
    uint104 lockedAmount;
    // Amount that was locked for selling options in the previous round
    // used for calculating performance fee deduction
    uint104 lastLockedAmount;
    // locked amount left to be used for collateral;
    uint lockedAmountLeft;
    // 32 byte slot 2
    // Stores the total tally of how much of `asset` there is
    // to be used to mint rTHETA tokens
    uint128 totalPending;
    // Amount locked for scheduled withdrawals;
    uint128 queuedWithdrawShares;
    // The timestamp next round will be ready to start
    uint nextRoundReadyTimestamp;
    // true if the current round is in progress, false if the round is idle
    bool roundInProgress;
    // expiration of round
    uint roundExpiration;
  }

  struct DepositReceipt {
    // Maximum of 65535 rounds. Assuming 1 round is 7 days, maximum is 1256 years.
    uint16 round;
    // Deposit amount, max 20,282,409,603,651 or 20 trillion ETH deposit
    uint104 amount;
    // Unredeemed shares balance
    uint128 unredeemedShares;
  }

  struct Withdrawal {
    // Maximum of 65535 rounds. Assuming 1 round is 7 days, maximum is 1256 years.
    uint16 round;
    // Number of shares withdrawn
    uint128 shares;
  }
}
