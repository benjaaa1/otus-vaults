import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";
import { useHistory } from "react-router-dom";
import { toast } from 'react-toastify';
import { ethers } from "ethers";
import { MESSAGE, TYPE, Notifier } from "../notifcations";

export default function useSupervisor() {

  const history = useHistory(); 

  const { contracts, signer } = useWeb3({});

  const [loading, setLoading] = useState(false); 

  const [userVaults, setUserVaults] = useState([]); 

  const otusController = contracts ? contracts['OtusController'] : "";

  useEffect(async () => {
    if(otusController) {
      try {
        setLoading(true)
        const { userVaults, userStrategies } = await otusController.connect(signer).getUserManagerDetails();
        console.log({ userVaults, userStrategies })

        const userVaultInformation = userVaults.map((vault, index) => {
          const strategy = userStrategies[index];
          return { vault, strategy }
        })
        console.log({ userVaultInformation })
        setUserVaults(userVaultInformation)

        setLoading(false);
      } catch (error) {
        console.log({ error })
        setLoading(false);
      }
    }
  }, [otusController])

  const viewMyVault = (vault, strategy) => {
    history.push(`/my-vault/${vault}/${strategy}`);
  }

  return { loading, userVaults, viewMyVault }

}
