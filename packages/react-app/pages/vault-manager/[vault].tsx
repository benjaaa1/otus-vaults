import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import VaultManagement from '../../components/VaultManager/VaultManagement'
import { getTwitterInfo, TwitterData } from '../api/utils/twitter'

const VaultManager: NextPage<{ twitter: TwitterData }> = (props) => {

  // const { username, profile_image_url } = props.twitter.data;
  // console.log(username, profile_image_url)
  return (
    <div className="flex h-full flex-col">
      <Head>
        <title>Manage your Decentralized Options Vault</title>
        <meta
          name="description"
          content="Manage your Decentralized Options Vaul Settings"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* <VaultManagement twitterHandle={username} twitterProfileImage={profile_image_url} /> */}
      <VaultManagement />

    </div>
  )
}

export default VaultManager
