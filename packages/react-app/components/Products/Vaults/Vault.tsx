import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import {
  formatUSD,
  fromBigNumber,
  toBN,
} from '../../../utils/formatters/numbers'
import ETHBWIcon from '../../UI/Components/Icons/BW/ETHBWIcon'
import BTCBWIcon from '../../UI/Components/Icons/BW/BTCBWIcon'
import SUSDIcon from '../../UI/Components/Icons/Color/SUSD'
import { Tag } from '../../UI/Components/Tag'
import { BigNumber } from 'ethers'
import { BYTES32_MARKET } from '../../../constants/markets'
import { Vault, VaultTrade } from '../../../utils/types/vault'
import { Twitter, TwitterData } from '../../../pages/api/utils/twitter'
import Avatar from 'react-avatar'
import { OPTION_TYPE_NAMES } from '../../../queries/lyra/useLyra'
// @ts-ignore
import Blockies from 'react-blockies'
import { Spinner } from '../../UI/Components/Spinner'

const BuildMarketTags = ({ allowedMarkets }: { allowedMarkets: string[] }) => {
  return <>
    {
      allowedMarkets.includes(BYTES32_MARKET.ETH) ?
        <div className="sm:absolute sm:ml-56 sm:mt-[-8px]">
          <ETHBWIcon />
        </div> :
        null
    }

    {
      allowedMarkets.includes(BYTES32_MARKET.BTC) ?
        <div className="sm:absolute sm:ml-56 sm:mt-[-8px]">
          <BTCBWIcon />
        </div> :
        null
    }
  </>
}

const getOptionTypeTag = (vaultTrades: VaultTrade[]) => {

  if (vaultTrades.length > 1) {
    return 'Mix';
  } else if (vaultTrades.length === 1) {
    const optionType = vaultTrades[0].optionType;
    return OPTION_TYPE_NAMES[optionType]
  } else {
    return 'No Active Trades'
  }

}

const Vault = ({ vault, twitter, vaultParticipants }: { vault: Vault, twitter?: Twitter, vaultParticipants?: any[] | null }) => {

  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <div
      onClick={(e) => handleVaultClick(e, `vault/${vault.id}`)}
      key={vault.id}
      className="cursor-pointer rounded-sm border border-zinc-800 bg-gradient-to-b from-black to-zinc-900 shadow-black  hover:shadow-[0px_0px_14px_6px_rgba(0,0,0,.6)]"
    >
      <div key={vault.id} className="overflow-hidden border-b border-zinc-800">
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 pb-4">
            <div className="col-span-2">
              <Tag
                label={getOptionTypeTag(vault.vaultTrades || [])}
                textVariant={'capitalize'}
                size={'sm'}
                variant={'primary'}
              />
            </div>
            <div className='col-span-1'>
              <div className='bg-zinc-900 inline-block rounded-full shadow-black'>
                <SUSDIcon />

              </div>
            </div>
            <div className="col-span-1">
              <Tag label={getHedgeLabel(vault.strategy.hedgeType)} size={'xs'} variant={'default'} />
            </div>
          </div>
          {vault.strategy.vaultStrategy.allowedMarkets && <BuildMarketTags allowedMarkets={vault.strategy.vaultStrategy.allowedMarkets} />}
        </div>
      </div>

      <div className="overflow-hidden border-b border-zinc-800">
        <div className="p-4 pt-8">

          <div className="truncate font-mono text-xs font-semibold uppercase text-white">
            {vault.name}
          </div>

          <div className="grid grid-cols-2">
            <div className="py-2">
              <div className="py-2 font-mono text-2xl font-normal text-white">
                10.2%
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Current Projected Apy
              </div>
            </div>

            <div className="py-2">
              <div className="overflow-x-auto">
                <div className="py-2 font-mono text-2xl font-normal text-white">
                  {vault.vaultTrades && vault.vaultTrades.length > 0 ?
                    vault.vaultTrades.length > 1 ? 'Multiple' : formatUSD(fromBigNumber(vault.vaultTrades[0].strikePrice))
                    : 'N/A'}
                </div>
                <div className="text-xxs font-light text-zinc-300 hover:text-white">
                  View all Current Strikes
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 ">

            <div className="py-4 col-span-1">
              <div className="py-2 font-mono text-lg font-normal text-white">
                {
                  twitter && twitter?.id && twitter.profile_image_url ?
                    <div>
                      <Avatar size="40" className='cursor-pointer' twitterHandle={twitter.username} src={twitter.profile_image_url} round={true} />
                    </div> :
                    <Blockies
                      size={10}
                      seed={vault?.manager.id}
                      className={'rounded-full border border-zinc-700'}
                    />
                }
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Managed By
              </div>
            </div>

            <div className="py-4 col-span-1">
              <div className="py-2 font-mono text-lg font-normal text-white">
                <div className='grid grid-cols-6'>
                  {/* <Avatar size="40" className='cursor-pointer' src={'https://i.imgur.com/5njQAB8.png'} round={true} /> */}

                  {
                    vaultParticipants ?
                      vaultParticipants.map(vaultParticipant => {
                        if (vaultParticipant.hasAvatar) {
                          return <Avatar size="40" className='cursor-pointer' src={vaultParticipant.avatarUrl} round={true} />
                        } else {
                          return <Blockies
                            size={10}
                            seed={vaultParticipant.user}
                            className={'rounded-full border border-zinc-700'}
                          />
                        }
                      }) :
                      <div className="mx-auto h-10">
                        <Spinner />
                      </div>
                  }
                </div>
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Vault Participants
              </div>
            </div>

            <div className="py-2">
              <div className="py-2 font-mono text-lg font-normal text-white">
                {fromBigNumber(vault.managementFee)}%
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Management Fees
              </div>
            </div>

            <div className="py-2 col-start-2 col-span-1">
              <div className="py-2 font-mono text-lg font-normal text-white">
                {fromBigNumber(vault.performanceFee)}%
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Performance Fees
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap justify-between py-2">
          <div className="text-xxs font-light text-white">Total Deposits</div>
          <div className="font-mono text-xxs font-normal text-white">
            {formatUSD(fromBigNumber(vault.totalDeposit))}
          </div>
        </div>
        <div className="rounded-xs h-3 w-full bg-zinc-800">
          <div
            className={`progress-bar h-3 bg-emerald-600`}
            style={{ width: percentWidth(vault.totalDeposit, vault.vaultCap) }}
          ></div>
        </div>
        <div className="flex flex-wrap justify-between py-2">
          <div className="text-xxs font-light text-white">Maximum Capacity</div>
          <div className="font-mono text-xxs font-normal text-white">
            {formatUSD(fromBigNumber(vault.vaultCap))}
          </div>
        </div>
      </div>
    </div >
  )
}

const percentWidth = (totalDeposit: BigNumber, vaultCap: BigNumber): string => {
  const formatTotalDeposit = fromBigNumber(totalDeposit)
  const formatVaultCap = fromBigNumber(vaultCap)

  return `${(formatTotalDeposit / formatVaultCap) * 10}%`
}

const getHedgeLabel = (hedgeType: number): string => {
  switch (hedgeType) {
    case 0:
      return 'No Hedge'
    case 1:
      return 'Manager'
    case 2:
      return 'Dynamic'
    default:
      return 'No Hedge'
  }
}

export default Vault

