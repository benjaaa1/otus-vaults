import { Button } from "../../Common/Button";
import React from "react";
import { useHistory, useParams } from "react-router-dom";

export default function VaultDetail({ otusVault, signer }) {

  const history = useHistory();

  const { vault } = useParams();

  const closeRound = async () => {
    try {
      const response = await otusVault.connect(signer).closeRound(); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  return (
    <div>
      <Button onClick={() => history.push(`/vault/${vault}`)}>View Vault Page</Button>
      <p>Asset</p>
      <p>Token Name</p>
      <p>Vault Type</p>
      <p>Staked: 1000</p>
      <p>Cap: 100000</p>
      <Button>Strategy</Button>
      <a>Keeper</a>
      <p>Performance Fee</p>
      <p>Management Fee</p>
    </div> 
  );
}