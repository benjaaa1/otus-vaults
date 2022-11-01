import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useWeb3Context, Web3ContextProvider } from '../context'
import { ToastContainer } from 'react-toastify'
import { QueryClientProvider, QueryClient } from 'react-query'

import 'react-toastify/dist/ReactToastify.css'
import React, { FC } from 'react'
import Layout from '../components/UI/Layout'
import { Network } from '../constants/networks'

const InnerApp: FC<AppProps> = ({ Component, pageProps }) => {
  const { network, provider } = useWeb3Context()

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

const MyApp: FC<AppProps> = (props) => {
  return (
    <Web3ContextProvider>
      <QueryClientProvider client={new QueryClient()}>
        <InnerApp {...props} />
        <ToastContainer
          hideProgressBar
          position="bottom-right"
          autoClose={2000}
        />
      </QueryClientProvider>
    </Web3ContextProvider>
  )
}

export default MyApp
