import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import Vault from '../components/Products/Vaults/Vault'
import { useVaultProducts } from '../queries/vaults/useVaultProducts'
import { Spinner } from '../components/UI/Components/Spinner'
import { useTwitters } from '../queries/manager/useTwitter'
import { Vault as VaultType } from '../utils/types/vault'
import { UserAction } from '../utils/types/portofolio'
import { ethers } from 'ethers'
import { SUPPORTED_NETWORKS } from '../constants/supportedChains'
import { EthereumChainId } from '../constants/networks'
import { useVaultsContext, VaultsContextProvider } from '../context/VaultsContext'
import Link from 'next/link'
import BTCIcon from '../components/UI/Components/Icons/Color/BTC'
import ETHIcon from '../components/UI/Components/Icons/Color/ETH'
import { StrategyDirection } from '../utils/types/builder'
import { StrategyType } from '../utils/types/builder'
import LyraIcon from '../components/UI/Components/Icons/Color/LYRA'
import { SNXIcon } from '../components/UI/Components/Currency/CurrencyIcon'
import SNXLogoIcon from '../components/UI/Components/Icons/Color/SNX'

type VaultFilters = {
  market: string
  optionTypes: number[]
  network: string
}

const Vaults: NextPage = () => {
  const vaultProducts = useVaultProducts() // need to refresh this when filters are updated pass in filters too
  const vaults = vaultProducts?.data?.vaults || [];
  const { data: twitterData } = useTwitters(vaults?.map(vault => vault.manager.twitter))

  const [vaultParticipants, setVaultParticipants] = useState<Record<string, any[]> | null>(null);
  const [filters, setFilters] = useState<VaultFilters>({ market: '', optionTypes: [], network: '' });

  const updateVaultParticipants = useCallback(async () => {
    if (vaults.length > 0) {

      const mainnetProvider = new ethers.providers.JsonRpcProvider(SUPPORTED_NETWORKS[EthereumChainId.Mainnet], EthereumChainId.Mainnet);

      const users: string[] = vaults.reduce((accum: string[], vault: VaultType) => {
        const _users: string[] = vault.userActions.map((userAction: UserAction) => userAction.id.split('-')[1]);
        return accum.concat(_users)
      }, [] as string[]);

      const userAvatarUrls = await Promise.all(users.map(async (user) => {
        const _ensName = await mainnetProvider.lookupAddress(user);
        const resolver = _ensName ? await mainnetProvider.getResolver(_ensName) : null;
        const avatar = resolver ? await resolver.getAvatar() : null;
        return { user, hasAvatar: avatar?.url ? true : false, avatarUrl: avatar?.url };
      }))

      const avatarsByUser = userAvatarUrls.reduce((accum, userAvatar) => {
        if (userAvatar.hasAvatar) {
          return { ...accum, [userAvatar.user]: userAvatar.avatarUrl }
        }
        return accum;
      }, {} as Record<string, any>)

      const vaultUsers = vaults.reduce((accum: Record<string, any[]>, vault: VaultType) => {
        const userIds = vault.userActions
          .map((userAction: UserAction) => userAction.id.split('-')[1])
          .map(user => {
            if (avatarsByUser.hasOwnProperty(user)) {
              return { address: user, hasAvatar: true, avatar: avatarsByUser[user] }
            } else {
              return { address: user, hasAvatar: false }
            }
          }).sort((a, b) => {
            return a.hasAvatar ? 1 : 0
          }).slice(0, 4);


        return { ...accum, [vault.id]: userIds }
      }, {} as Record<string, any[]>)

      setVaultParticipants(vaultUsers);
    }
  }, [vaults]);

  useEffect(() => {
    if (vaults.length > 0) {
      updateVaultParticipants();
    }
  }, [vaults])

  useEffect(() => {
    if (filters.market != '' || filters.optionTypes.length > 0 || filters.network != '') {
      // 
    }
  }, [filters]);

  const handleSelectedMarket = (value: string) => {
    setFilters((params: VaultFilters) => ({
      ...params,
      market: value
    }))
  }

  const handleSelectedOptionTypes = (value: number[]) => {
    // setFilters((params: VaultFilters) => ({
    //   ...params,
    //   market: value
    // }))
  }

  const handleSelectedNetworks = (value: string) => {
    setFilters((params: VaultFilters) => ({
      ...params,
      network: value
    }))
  }

  return (
    <div>
      <Head>
        <title>Otus Finance: Decentralized Options Vaults</title>
        <meta name="descript ion" content="Decentralized Options Vaults" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VaultsContextProvider>

        {/* divide-y divide-zinc-800 */}

        <div className="border-b border-zinc-800">
          <div className=" mx-auto sm:max-w-7xl grid sm:grid-cols-1 grid-cols-1 py-6">
            <div className='font-bold text-sm text-white py-2'>
              Otus Vaults are community created and managed.
            </div>
            <div className='font-light text-xs text-zinc-300'>
              Vaults are managed by community members, some of their experience is shown by <Link href='/badges'><a className='underline'>badges</a></Link> they’ve earned.
            </div>
            <div className='font-light text-xs text-zinc-300 py-1'>
              Vaults trade options, perpetual futures, or other instruments.
            </div>
            <div className='font-light text-xs text-zinc-300'>
              Learn more about perpetual futures, options and some of the risks involved <Link href='/learn'><a className='underline'>here</a></Link>.
            </div>
          </div>
        </div>
        <div className=" mx-auto sm:max-w-7xl">
          <div className="grid sm:grid-cols-1 grid-cols-1 py-2">

            <div className='py-2'>
              <Markets />
            </div>

            <div className='py-2'>
              <h2 className='font-bold text-sm text-white py-4'>
                I think the market will be:
              </h2>
              <Direction />
            </div>

            <div className='py-2'>
              <h2 className='font-bold text-sm text-white py-4'>
                by the following dates:
              </h2>
              <Dates />
            </div>

            <div className='py-2'>
              <h2 className='font-bold text-sm text-white py-4'>
                my trade type preference:
              </h2>
              <TradePreference />
            </div>

          </div>
          <div className="py-6">
            <h2 className='font-bold text-sm text-white pb-8'>
              Recommended vaults:
            </h2>
            {/* <div className="mx-auto max-w-2xl py-14">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="p-1 ">
              <SelectFilterMarket selectedMarket={filters.market} setSelectedMarket={handleSelectedMarket} />
            </div>
            <div className="p-1">
              <SelectFilterOptionType selectedOptionTypes={filters.optionTypes} setSelectedOptionTypes={handleSelectedOptionTypes} />
            </div>
            <div className="p-1">
              <SelectFilterNetwork selectedNetwork={filters.network} setSelectedNetwork={handleSelectedNetworks} />
            </div>
          </div>
        </div> */}

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-4">
              {vaultProducts?.isLoading ? (
                <div className="col-span-3 mx-auto">
                  <Spinner />
                </div>
              ) : (
                vaults.map((vault) => {
                  const _twitter = twitterData && twitterData[vault.manager.twitter];
                  const _vaultParticipants = vaultParticipants && vaultParticipants[vault.id];
                  return <Vault key={vault.id} vault={vault} twitter={_twitter} vaultParticipants={_vaultParticipants} />
                })
              )}
            </div>
          </div>
        </div>
      </VaultsContextProvider>
    </div>
  )
}

const Markets = () => {

  const { toggleMarkets, markets } = useVaultsContext();

  return <div className='flex'>
    <div
      onClick={() => toggleMarkets('ETH')}
      className={`p-1 w-32 border hover:border-emerald-700 sm:mr-4 mt-4 border-zinc-800 cursor-pointer ${markets.includes('ETH') && 'border-emerald-700'}`}>
      <div className="flex items-center p-1">
        <ETHIcon />
        <div className=" text-sm pl-2 text-white">
          <strong>ETH</strong>
        </div>
      </div>
    </div>
    <div
      onClick={() => toggleMarkets('BTC')}
      className={`p-1 w-32 border hover:border-emerald-700 sm:mr-4 mt-4 border-zinc-800 cursor-pointer ${markets.includes('BTC') && 'border-emerald-700'}`}>
      <div className="flex items-center p-1">
        <BTCIcon />
        <div className="text-sm pl-2  text-white">
          <strong>BTC</strong>
        </div>
      </div>
    </div>
  </div>
}

const DirectionType: StrategyDirection[] = [
  {
    id: StrategyType.Bearish,
    name: '🐻Bearish'
  },
  {
    id: StrategyType.Bullish,
    name: '🐂Bullish'
  },
  {
    id: StrategyType.Volatile,
    name: '🌊Volatile'
  },
  {
    id: StrategyType.Calm,
    name: '⛵Calm'
  },
  {
    id: StrategyType.Neutral,
    name: '✌Neutral'
  },
  {
    id: StrategyType.NoIdea,
    name: '😶No Idea '
  }
]


const Direction = () => {

  const { toggleDirections, directions } = useVaultsContext();

  return <div className='flex flex-wrap'>
    {
      DirectionType.map(direction => {
        const active = directions.includes(direction.id) ? 'border-emerald-700' : ''
        return <div
          onClick={() => toggleDirections(direction.id)}
          className={`p-2 sm:w-32 w-full border hover:border-emerald-700 sm:mr-2 mt-2 border-zinc-800 cursor-pointer ${active}`}>
          <div className="p-2">
            <div className='text-sm text-center text-white font-semibold cursor-pointer'>{direction.name}</div>
          </div>
        </div>
      })
    }
  </div>
}

const Dates = () => {
  return <div className='flex'>
    <div
      className={`p-2 w-32 border hover:border-emerald-700 sm:mr-2 mt-2 cursor-pointer border-zinc-800`}>
      <div className="items-center p-2">
        <span className='text-sm items-center text-white font-semibold cursor-pointer'>ETH</span>
      </div>
    </div>
    <div
      className={`p-2 w-32 border hover:border-emerald-700 sm:mr-2 mt-2 cursor-pointer border-zinc-800 `}>
      <div className="items-center p-2">

        <span className='text-sm items-center text-white font-semibold cursor-pointer'>BTC</span>
      </div>
    </div>
  </div>
}

const TradePreference = () => {

  return <div className='flex flex-wrap'>
    <div
      className={`p-2 border border-emerald-700 sm:mr-2 mt-2 sm:w-max w-full cursor-pointer`}>
      <div className="items-center p-2">
        <div className="flex items-center p-1">
          <LyraIcon />
          <div className="text-sm pl-2  text-white">
            <strong>Options</strong>
          </div>
        </div>
      </div>
    </div>
    <div
      className={`p-2  border hover:border-zinc-900 sm:mr-2 mt-2 w-full sm:w-max border-zinc-800 cursor-not-allowed`}>
      <div className="items-center p-2">
        <div className="flex items-center p-1">
          <SNXLogoIcon />
          <div className="text-sm pl-2  text-zinc-400">
            <strong>Perpetual Futures*</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default Vaults
