import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3Modal from "web3modal";
import { ALCHEMY_KEY, INFURA_ID } from "../constants";

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`, 1);

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID, // required
    },
  },
}
const web3ModalSetup = () =>
  new Web3Modal({
    network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
    cacheProvider: true, // optional
    theme: "dark", // optional. Change to "dark" for a dark theme.
    providerOptions
    // providerOptions: {
    //   walletconnect: {
    //     package: WalletConnectProvider, // required
    //     options: {
    //       bridge: "https://polygon.bridge.walletconnect.org",
    //       infuraId: INFURA_ID,
    //       rpc: {
    //         10: "https://mainnet.optimism.io", // xDai
    //         100: "https://rpc.gnosischain.com", // xDai
    //         137: "https://polygon-rpc.com",
    //         31337: "http://localhost:8545",
    //         42161: "https://arb1.arbitrum.io/rpc",
    //         80001: "https://rpc-mumbai.maticvigil.com",
    //       },
    //     },
    //   },
    //   "custom-walletlink": {
    //     display: {
    //       logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
    //       name: "Coinbase",
    //       description: "Connect to Coinbase Wallet (not Coinbase App)",
    //     },
    //     package: walletLinkProvider,
    //     connector: async (provider, _options) => {
    //       await provider.enable();
    //       return provider;
    //     },
    //   }
    // },
  });

export default web3ModalSetup;
