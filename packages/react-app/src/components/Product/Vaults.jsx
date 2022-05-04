import React from "react";
import { Button } from "../Common/Button"; 
import { useHistory } from "react-router-dom";

export const Vaults = ({ vaults }) => {

  const history = useHistory();
  console.log({vaults1: vaults})
  return vaults.map(vault => <Button onClick={() =>  history.push(`/vault/${vault}`)}>{vault}</Button>)
}
