import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants";

export default function useChainId(userSigner) {
  
  const [selectedChainId, setSelectedChainId] = useState(NETWORKS.optimism.chainId); 

  useEffect(() => {
    if(userSigner && userSigner.provider._network.chainId) {
      setSelectedChainId(userSigner.provider._network.chainId)
    }
  }, [userSigner])
  // const [localChainId] = useState(localProvider._network.chainId);
  console.log({ selectedChainId, userSigner })
  return selectedChainId; 
  
}
