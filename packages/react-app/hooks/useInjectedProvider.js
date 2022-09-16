import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { Web3ModalSetup } from "../helpers";

const web3Modal = Web3ModalSetup();

export default function useInjectedProvider() {
  const [injectedProvider, setInjectedProvider] = useState();

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
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  const logoutOfWeb3Modal = async () => {

    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }

    setTimeout(() => {
      window.location.reload();
    }, 1);
  };
  
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  return [injectedProvider, loadWeb3Modal, logoutOfWeb3Modal, web3Modal.cachedProvider];
}
