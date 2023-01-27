import { useState, useCallback, useEffect } from 'react'
import {
  useVaultProduct
} from '../../../queries/vaults/useVaultProducts'
import { useRouter } from 'next/router'
import Transact from './Transact'
import { UserActionTabs } from '../../../constants/tabs'
import Deposit from './Deposit'
import { Button } from '../../UI/Components/Button'
import Withdraw from './Withdrawal'
import { useWeb3Context } from '../../../context'
import { getBlockExplorerUrl } from '../../../utils/getBlockExplorer'
import Modal from '../../UI/Modal'
import { formatUSD, fromBigNumber } from '../../../utils/formatters/numbers'
import { CheckIcon } from '@heroicons/react/24/solid'
import TradeTransactions from './TradeTransactions'
import { HedgeStrategyInfo } from './StrategyModalInfo/HedgeStrategyInfo'
import { StrikeStrategyInfo } from './StrategyModalInfo/StrikeStrategyInfo'
import { VaultStrategyInfo } from './StrategyModalInfo/VaultStrategyInfo'
import Link from 'next/link'
import Avatar from 'react-avatar'
import { useTwitter } from '../../../queries/manager/useTwitter'
import { ethers } from 'ethers'
import { UserAction } from '../../../utils/types/portofolio'
// @ts-ignore
import Blockies from 'react-blockies'
import { Spinner } from '../../UI/Components/Spinner'

export default function Product() {
  const { network } = useWeb3Context()
  const router = useRouter()
  const { query } = router
  const { data: vault } = useVaultProduct(query?.vault)

  const { data: twitterData } = useTwitter(vault?.manager.twitter)

  const [tab, setTab] = useState<string>(UserActionTabs.DEPOSIT.HREF)
  const [openVaultStrategy, setOpenVaultStrategy] = useState(false)
  const [openStrikeStrategy, setOpenStrikeStrategy] = useState(false)
  const [openHedgeStrategy, setOpenHedgeStrategy] = useState(false)

  const [premiumCollected, setPremiumCollected] = useState(0);

  const calculatePremiumEarned = useCallback(() => {
    if (vault != null && vault.vaultTrades.length > 0) {
      const _premium = vault.vaultTrades.reduce((accum, trade) => {
        let { premiumEarned } = trade;
        let _premiumCollectedInTrade = fromBigNumber(premiumEarned);
        return accum + _premiumCollectedInTrade;;
      }, 0);
      setPremiumCollected(_premium);
    } else {
      setPremiumCollected(0);
    }
  }, [vault])

  useEffect(() => {
    try {
      calculatePremiumEarned()
    } catch (error) {
      console.log({ error })
    }
  }, [vault])

  const [vaultParticipants, setVaultParticipants] = useState<any[]>([]);

  const updateVaultParticipants = useCallback(async () => {
    if (vault) {

      const mainnetProvider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925', 1);

      const users: string[] = vault.userActions.map((userAction: UserAction) => userAction.id.split('-')[1]);

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
        }).slice(0, 8);

      setVaultParticipants(userIds);
    }
  }, [vault]);

  useEffect(() => {
    if (vault) {
      updateVaultParticipants();
    }
  }, [vault])

  return (
    <>
      <div className="h-full">
        <main className='py-8 mx-auto max-w-5xl'>

          <div className="mx-auto max-w-3xl text-white md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-3xl font-bold uppercase text-zinc-200">
                  {vault?.name || <span>---</span>}
                </h1>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-8 pb-4">
            <div className="col-span-1 sm:col-span-7 grid grid-cols-1 rounded-sm border border-zinc-700 bg-gradient-to-b from-black to-zinc-900 p-9">
              <div className="py-2">
                <div className="text-xxs font-bold uppercase text-zinc-300">
                  Strategy Description
                </div>
                <div className="py-4 text-xs font-normal text-zinc-300">
                  {vault?.description || '---'}
                </div>
              </div>
              <div className="py-2">
                <span className="round text-xxs font-bold uppercase text-zinc-300">
                  Current Strategies
                </span>
                <div className="grid grid-cols-3 py-4">
                  <div>
                    <Button
                      label="Vault Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => setOpenVaultStrategy(true)}
                    />
                  </div>
                  <div>
                    <Button
                      label="Strike Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => setOpenStrikeStrategy(true)}
                    />
                  </div>
                  <div>
                    {' '}
                    <Button
                      label="Hedge Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => setOpenHedgeStrategy(true)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 py-4">
                <div className="py-4 text-sm font-bold uppercase text-zinc-400">
                  Vault Snapshot
                </div>
                <div className="grid grid-cols-3">
                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Current Projected Apy
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      10.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Previous Week Performance
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      0.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Cumulative Yield
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      -12.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Premium Collected
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      {formatUSD(premiumCollected)}
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Current Round
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      {vault?.round}
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Is Active
                    </div>
                    <div className="py-2 font-mono text-xl font-bold text-white">
                      {vault?.isActive ? <CheckIcon
                        className="h-5 w-5 text-emerald-600"
                        aria-hidden="true"
                      /> : 'No'}
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <div className="grid grid-cols-4">
                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Managed By
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        <Link href={`/manager/${vault?.manager.id}`}>

                          {
                            twitterData?.data.id && twitterData.data.profile_image_url ?
                              <div>
                                <Avatar size="40" className='cursor-pointer' twitterHandle={twitterData.data.username} src={twitterData.data.profile_image_url} round={true} />
                              </div> :
                              <div>
                                {vault?.manager.id}
                              </div>
                          }

                        </Link>
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Management Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        {vault?.managementFee}%
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Performance Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        {vault?.performanceFee}%
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Platform Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        0%
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1">
                <div className="py-4 text-sm font-bold uppercase text-zinc-400">
                  Vault Participants
                </div>
                <div className="grid grid-cols-12">


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
            </div>
            <div className="col-span-1 sm:col-span-5">
              <div className="rounded-sm border border-zinc-700 bg-zinc-800 shadow shadow-black">
                <Transact setTab={setTab} active={tab} />
                {tab == UserActionTabs.DEPOSIT.HREF ? (
                  <Deposit vault={vault} />
                ) : (
                  <Withdraw vault={vault} />
                )}
              </div>
              <div className="mt-4">
                <Button
                  label={`Contract Address: ${vault?.id.substring(0, 10)}...`}
                  variant={'primary'}
                  textVariant={'lowercase'}
                  size={'full-sm'}
                  radius={'full'}
                  textColor={'text-zinc-500'}
                  onClick={() => {
                    const url = getBlockExplorerUrl(network?.chainId || 10)
                    window.open(`${url}address/${vault?.id}`)
                  }}
                ></Button>
              </div>
            </div>
          </div>
        </main>

        <div className="mx-auto max-w-5xl">

          <TradeTransactions vaultTrades={vault?.vaultTrades || []} />

        </div>

      </div>
      <Modal
        title={'Vault Strategy'}
        setOpen={setOpenVaultStrategy}
        open={openVaultStrategy}
      >
        {vault?.strategy.vaultStrategy ? <VaultStrategyInfo strategy={vault?.strategy.vaultStrategy} /> : null}
      </Modal>
      <Modal
        title={'Strike Strategy'}
        setOpen={setOpenStrikeStrategy}
        open={openStrikeStrategy}
      >
        {vault?.strategy.strikeStrategies ? <StrikeStrategyInfo strikeStrategies={vault?.strategy.strikeStrategies} /> : null}
      </Modal>
      <Modal
        title={'Hedge Strategy'}
        setOpen={setOpenHedgeStrategy}
        open={openHedgeStrategy}
      >
        <HedgeStrategyInfo hedgeType={vault?.strategy.hedgeType || 0} strategy={vault?.strategy.dynamicHedgeStrategy} />
      </Modal>
    </>
  )
}
