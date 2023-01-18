import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import Avatar from 'react-avatar';
import { useManager } from '../../queries/manager/useManagers';
import { useTwitter } from '../../queries/manager/useTwitter';

import { useRouter } from 'next/router';
import { ZERO_BN } from '../../constants/bn';
import { BigNumber } from 'ethers';
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers';
import { useUserPortfolio, useUserPortfolioById } from '../../queries/portfolio/useUserPortfolio';
import { useWeb3Context } from '../../context';
import ManagerVaults from '../../components/Manager/Vaults';
import ManagerDeposits from '../../components/Manager/Deposits';

const Manager: NextPage = () => {

  const router = useRouter()

  const { query } = router;

  const { data: manager } = useManager(query?.address)

  const { data: twitterData } = useTwitter(manager?.twitter)
  console.log({ twitterData })

  const { network } = useWeb3Context();

  const { data: userPortfolio } = useUserPortfolioById(query?.address, network);
  console.log({ userPortfolio })

  const [totalManaged, setTotalManaged] = useState<BigNumber>(ZERO_BN);
  const [totalDeposited, setTotalDeposited] = useState<BigNumber>(ZERO_BN);

  const calculateTotalManaged = useCallback(() => {
    if (manager?.vaults && manager.vaults.length > 0) {
      const _total = manager.vaults.reduce((accum, val) => {
        const { totalDeposit } = val;
        return accum.add(totalDeposit);
      }, ZERO_BN as BigNumber)
      setTotalManaged(_total);
    }
  }, [manager]);

  useEffect(() => {
    if (manager?.vaults && manager.vaults.length > 0) {
      calculateTotalManaged()
    }
  }, [manager])

  const calculateTotalDeposited = useCallback(() => {
    if (userPortfolio) {
      setTotalDeposited(userPortfolio.balance);
    }
  }, [userPortfolio])

  useEffect(() => {
    if (userPortfolio) {
      calculateTotalDeposited()
    }
  }, [userPortfolio])

  return (
    <div >
      <Head>
        <title>Decentralized Options Vault Detail</title>
        <meta
          name="description"
          content="Information: Decentralized Options Vault"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='mx-auto w-full max-w-container'>
        <div className='mx-auto max-w-5xl py-8'>
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1 flex items-center  space-x-5">

              <div>
                {
                  twitterData?.data.id && twitterData.data.profile_image_url ?
                    <a target={'_blank'} href={`https://www.twitter.com/${twitterData.data.username}`}>
                      <Avatar className='cursor-pointer' twitterHandle={twitterData.data.username} src={twitterData.data.profile_image_url} round={true} size={'60px'} />
                    </a> :
                    null
                }
              </div>

              <div>
                <h1 className="text-3xl font-semibold text-zinc-200">
                  {twitterData?.data.username || <span>---</span>}
                </h1>
              </div>

            </div>
            <div className="flex md:mt-0 md:ml-4">

              <div className='rounded-sm border border-zinc-700 bg-zinc-800 shadow shadow-black p-2'>

                <div className='grid grid-cols-3'>

                  <div className="p-4">

                    <div className="pb-3 font-mono text-2xl font-normal text-white">
                      12.2%
                    </div>

                    <div className="text-xxs  font-normal uppercase text-zinc-300">
                      Managed ROI
                    </div>
                  </div>

                  <div className="p-4 border-l border-zinc-700 ">

                    <div className="pb-3 font-mono text-2xl font-normal text-white">
                      {formatUSD(fromBigNumber(totalManaged))}
                    </div>
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Total Managed
                    </div>
                  </div>

                  <div className="p-4 border-l border-zinc-700 ">

                    <div className="pb-3 font-mono text-2xl font-normal text-white">

                      {formatUSD(fromBigNumber(totalDeposited))}

                    </div>
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Total Deposited
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      </main>

      <div className="mx-auto max-w-5xl">

        <ManagerVaults />
      </div>

      <div className="mx-auto max-w-5xl">

        <ManagerDeposits />

      </div>

    </div>
  )
}

export default Manager;

