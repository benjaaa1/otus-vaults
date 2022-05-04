import { useUserProviderAndSigner } from "eth-hooks";
import React, { useCallback, useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import { Account, Header } from "./components/utils";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";

import deployedContracts from "./contracts/hardhat_contracts.json";
import { Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";
import Product from "./components/Product";
import Supervisor from "./components/Supervisor";
import { Vault } from "./components/Product/Vault";
import { Top } from "./components/Common/Top";
import { Views } from "./components/Common/Views";

const { ethers } = require("ethers");

const initialNetwork = NETWORKS.kovanOptimism; 
const web3Modal = Web3ModalSetup();

const providers = [
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
];
function App(props) {
  const networkOptions = [initialNetwork.name, "optimism", "kovanOptimism"];
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);

  const targetNetwork = NETWORKS[selectedNetwork];
  const blockExplorer = targetNetwork.blockExplorer;
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers);

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, false);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        console.log({ newAddress })
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  return (
    <div className="App">
      <Top 
        address={address}
        localProvider={localProvider}
        userSigner={userSigner}
        mainnetProvider={mainnetProvider}
        web3Modal={web3Modal}
        loadWeb3Modal={loadWeb3Modal}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        blockExplorer={blockExplorer}
      />
      <Views>
        <Switch>
          <Route exact path="/">
            <Product 
              signer={userSigner}
              contractConfig={contractConfig} 
              chainId={localChainId}
            />
          </Route>
          <Route exact path={`/vault/:vault`}>
            <Vault
              name="OtusVault"
              signer={userSigner}
              provider={localProvider}
              address={address}
              contractConfig={contractConfig} 
              chainId={localChainId}
            />
          </Route>
          <Route path="/portfolio">
            Portfolio         
          </Route>
          <Route path="/supervisors">
            <Supervisor 
              name="OtusCloneFactory"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
              chainId={localChainId}
            />
          </Route>
        </Switch>
      </Views>
    </div>
  );
}

export default App;
