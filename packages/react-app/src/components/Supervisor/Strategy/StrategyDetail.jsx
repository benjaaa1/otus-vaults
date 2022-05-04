import React from "react";
import { useContractLoader } from "eth-hooks";
import { Button } from "../../Common/Button";
import { InputNumber } from "../../Common/Input";

export default function StrategyDetail({ strategyAddress, signer, contractConfig, chainId }) {
  console.log({ strategyAddress })
  const contracts = useContractLoader(signer, { ...contractConfig, customAddresses: { Strategy: strategyAddress } }, chainId);

  const contract = contracts ? contracts['Strategy'] : "";
  console.log({ contract })
  const onChange = () => {}

  const setStrategy = async () => {
    try {
      // const response = await contract.connect(signer).setStrategy(); 
      ///console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  return (
    <div>
      <p>Last Expiry Fees</p>
      <p>Current Strike</p>
      <Button>Select Strike</Button> 
      <p>Current Strategy</p>
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <p>Hedge Strategy</p>
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
      <Button onClick={setStrategy}>Set Strategy</Button>
    </div> 
  );
}

/**
 * Strategy.sol
 */
// setStrategy 