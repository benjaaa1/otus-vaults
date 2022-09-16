import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants";

const initialNetwork = NETWORKS.kovanOptimism;

export default function useNetwork() {
  const networkOptions = [
    initialNetwork.name, 
    NETWORKS.optimism.name, 
    NETWORKS.kovan.name,
    NETWORKS.mainnet.name
  ];

  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);

  const targetNetwork = NETWORKS[selectedNetwork];
  const blockExplorer = targetNetwork.blockExplorer;

  return [targetNetwork, blockExplorer];

}
