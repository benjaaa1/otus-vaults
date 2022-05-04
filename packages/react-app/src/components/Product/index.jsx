import React, { useEffect, useState } from "react";
import { Vaults } from "./Vaults"; 
import { useContractLoader } from "eth-hooks";

const Product = ({ signer, contractConfig, chainId  }) => {

  const [vaults, setVaults] = useState([]); 
  console.log({vaults})
  const contracts = useContractLoader(signer, contractConfig, chainId);

  const contract = contracts ? contracts['OtusCloneFactory'] : "";

  useEffect(async () => {
    if(contract) {
      const _vaults = await contract.getActiveVaults();  
      console.log({ _vaults });
      setVaults(_vaults);  
    }
  }, [contract])

  return <Vaults vaults={vaults} />;
  
}

export default Product;
