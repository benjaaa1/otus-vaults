import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import Avatar from 'react-avatar';
import { useManager } from '../../queries/manager/useManagers';
import { useTwitter } from '../../queries/manager/useTwitter';

import { useRouter } from 'next/router';

const Manager: NextPage = () => {

  const router = useRouter()

  const { query } = router;

  const { data: manager } = useManager(query?.address)

  const { data: twitterData } = useTwitter(manager?.twitter)


  return (
    <div className="flex flex-col">
      <Head>
        <title>Decentralized Options Vault Detail</title>
        <meta
          name="description"
          content="Information: Decentralized Options Vault"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='py-8 mx-auto max-w-5xl'>
        <div className=" text-white md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-center space-x-5">
            <div>
              {
                twitterData?.data.id && twitterData.data.profile_image_url ?
                  <div>
                    <Avatar className='cursor-pointer' twitterHandle={twitterData.data.username} src={twitterData.data.profile_image_url} round={true} size={'60px'} />
                  </div> :
                  null
              }
            </div>
            <div>
              <h1 className="text-3xl font-bold uppercase text-zinc-200">
                {twitterData?.data.username || <span>---</span>}
              </h1>
            </div>
          </div>
          <div className="justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
          </div>
        </div>

      </main>
    </div>
  )
}

export default Manager;

