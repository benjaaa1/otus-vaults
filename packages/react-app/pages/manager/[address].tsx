import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import Avatar from 'react-avatar';
import ErrorPage from "next/error";
import { TwitterData } from '../api/utils/twitter';

const Manager: NextPage<{ twitter: TwitterData }> = (props) => {

  if (!props.twitter.data) {
    return <ErrorPage statusCode={404} />;
  }

  const { username, id, name, profile_image_url } = props.twitter.data;

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
              <Avatar twitterHandle={username} src={profile_image_url} round={true} size={'60px'} />
            </div>
            <div>
              <h1 className="text-3xl font-bold uppercase text-zinc-200">
                {name || <span>---</span>}
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

export const getServerSideProps: GetServerSideProps = async ({
  params,
  res
}) => {
  try {

    const twitterHandle = 'otusfinance';

    const twitter = await fetch(`http://localhost:3000/api/twitter/${twitterHandle}`);
    console.log({ twitter })

    return { props: { twitter: await twitter.json() } }
  } catch {
    res.statusCode = 404;
    return {
      props: {}
    };
  }
};

export default Manager;

