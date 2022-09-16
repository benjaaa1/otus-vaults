
import { Address, BigInt, ethereum, log, Bytes } from '@graphprotocol/graph-ts'
import { GLOBAL_ID, ZERO_ADDRESS } from './constants'
import {
  Global
} from '../../generated/schema'

export let ZERO = BigInt.fromI32(0)
export let ONE = BigInt.fromI32(1)
export let UNIT = BigInt.fromString('1' + '0'.repeat(18))
export let UNITDECIMAL = UNIT.toBigDecimal()

export let FIVE_MINUTE_SECONDS: i32 = 300
export let FIFTEEN_MINUTE_SECONDS: i32 = FIVE_MINUTE_SECONDS * 3
export let HOUR_SECONDS: i32 = FIFTEEN_MINUTE_SECONDS * 4
export let DAY_SECONDS: i32 = 86400

//THESE MUST BE IN ASCENDING ORDER
//LARGER PERIODS MUST BE A MULTIPLE OF SMALLER PERIODS
export let PERIODS: i32[] = [FIFTEEN_MINUTE_SECONDS, HOUR_SECONDS, DAY_SECONDS]
export let HOURLY_PERIODS: i32[] = [HOUR_SECONDS, DAY_SECONDS]

export namespace Entity {
  export function loadOrCreateGlobal(): Global {
    let global = Global.load(GLOBAL_ID)
    if (global == null) {
      global = new Global(GLOBAL_ID)
    }
    return global as Global
  }

  export enum PositionState {
    EMPTY,
    ACTIVE,
    CLOSED,
    LIQUIDATED,
    SETTLED,
    MERGED,
  }

  enum TradeType {
    LongCall,
    LongPut,
    ShortCallBase,
    ShortCallQuote,
    ShortPutQuote,
  }

  export function getIsCall(tradeType: TradeType): boolean {
    return (
      tradeType === TradeType.LongCall ||
      tradeType === TradeType.ShortCallBase ||
      tradeType === TradeType.ShortCallQuote
    )
  }

  export function getIsLong(tradeType: TradeType): boolean {
    return tradeType === TradeType.LongCall || tradeType === TradeType.LongPut
  }

  export function getIsBaseCollateralized(tradeType: TradeType): boolean {
    return tradeType === TradeType.ShortCallBase
  }

  export function getIDFromAddress(address: Address): string {
    return address.toHex()
  }

  export function getPendingDepositOrWithdrawID(vaultAddress: Address, positionId: BigInt, isDeposit: boolean): string {
    let depOrWith = isDeposit ? 'deposit' : 'withdraw'
    return vaultAddress.toHex() + '-' + depOrWith + '-' + positionId.toString()
  }

  export function getDepositOrWithdrawalID(vaultAddress: Address, userAddress: string, txHash: Bytes): string {
    return vaultAddress.toHex() + '-' + userAddress + '-' + txHash.toHex()
  }

  export function getVaultUserLiquidity(vaultAddress: Address, userAddress: Address): string {
    return vaultAddress.toHex() + '-' + userAddress.toHex()
  }

}