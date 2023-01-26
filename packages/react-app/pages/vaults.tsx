import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import Vault from '../components/Products/Vaults/Vault'
import { useVaultProducts } from '../queries/vaults/useVaultProducts'
import { Spinner } from '../components/UI/Components/Spinner'
import { SelectFilterMarket } from '../components/Products/Vaults/Filters/market'
import { SelectFilterOptionType } from '../components/Products/Vaults/Filters/optionType'
import { SelectFilterNetwork } from '../components/Products/Vaults/Filters/network'
import { useTwitters } from '../queries/manager/useTwitter'
import { Vault as VaultType } from '../utils/types/vault'
import { UserAction } from '../utils/types/portofolio'
import { ethers } from 'ethers'

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

      const mainnetProvider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925', 1);

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
            return a.hasAvatar
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

  console.log({ vaultParticipants })

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

      <div className="mx-auto sm:max-w-5xl py-6">
        <div className="mx-auto max-w-2xl py-14">
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
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
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
  )
}

export default Vaults
