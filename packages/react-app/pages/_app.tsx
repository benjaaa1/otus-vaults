import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Web3ContextProvider } from '../context'
import { ToastContainer } from 'react-toastify'
import { QueryClientProvider, QueryClient } from 'react-query'

import 'react-toastify/dist/ReactToastify.css'
import React from 'react'
import Layout from '../components/UI/Layout'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ContextProvider>
      <QueryClientProvider client={new QueryClient()}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
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
