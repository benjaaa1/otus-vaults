// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IFuturesMarket {
  function transferMargin(int marginDelta) external;

  function remainingMargin(
    address account
  ) external view returns (uint marginRemaining, bool invalid);

  function withdrawAllMargin() external;

  function modifyPosition(int sizeDelta) external;

  function modifyPositionWithTracking(int sizeDelta, bytes32 trackingCode) external;

  function closePosition() external;

  function closePositionWithTracking(bytes32 trackingCode) external;

  function orderFee(int sizeDelta) external view returns (uint fee, bool invalid);

  function positions(
    address account
  )
    external
    view
    returns (uint64 id, uint64 fundingIndex, uint128 margin, uint128 lastPrice, int128 size);

  function assetPrice() external view returns (uint price, bool invalid);
}
