import React from "react";
import { useParams } from "react-router-dom";
import { Header } from "./Header";
import { Performance } from "./Performance";
import { Risks } from "./Risks";
import { Transactions } from "./Transactions";
import { UserActions } from "./UserActions";

export const Vault = ({ name, signer, provider, address, contractConfig, chainId }) => {

  const { vault } = useParams();

  return (
    <div>
      vault: { vault }
      <Header />
      <Performance />
      <Transactions />
      <Risks />
      <UserActions name={name} address={address} signer={signer} provider={provider} contractConfig={contractConfig} chainId={chainId} />
    </div>
  );
}
