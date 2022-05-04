import React from "react";
import { Deposit } from "./Deposit";
import { Withdrawal } from "./Withdrawal";
import { useContractLoader } from "eth-hooks";
import { useParams } from "react-router-dom";

export const UserActions = ({ name, signer, address, provider, contractConfig, chainId }) => {

const { vault } = useParams();

const contracts = useContractLoader(signer, { ...contractConfig, customAddresses: { OtusVault: vault } }, chainId);
console.log({ contracts }); 
const otusVaultContract = contracts ? contracts[name] : "";
const susdContract = contracts ? contracts['MockSUSD'] : "";

console.log({ otusVaultContract, susdContract }); 

  return (
    <div>
      <Deposit otusVaultContract={otusVaultContract} susdContract={susdContract} address={address} signer={signer} />
      <Withdrawal otusVaultContract={otusVaultContract} susdContract={susdContract}  address={address} signer={signer} />
    </div>
  );
}
