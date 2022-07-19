import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { ethers } from "ethers";
import { MESSAGE, TYPE, Notifier } from "../notifcations";

export default function useSupervisor() {

  let navigate = useNavigate();

  const { contracts, signer } = useWeb3({});

  const [userVaults, setUserVaults] = useState([]); 

  const otusController = contracts ? contracts['OtusController'] : "";

  useEffect(async () => {
    if(otusController) {
      try {
        const { userVaults, userStrategies } = await otusController.connect(signer).getUserManagerDetails();
        console.log({ userVaults, userStrategies })

        const userVaultInformation = userVaults.map((vault, index) => {
          const strategy = userStrategies[index];
          return { vault, strategy }
        })
        console.log({ userVaultInformation })
        setUserVaults(userVaultInformation)

      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusController])

  const viewMyVault = (vault, strategy) => {
    navigate(`/my-vaults/${vault}/${strategy}`);
  }

  return { userVaults, viewMyVault }

}
