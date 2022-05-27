import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";
import { useHistory } from "react-router-dom";
import { toast } from 'react-toastify';
import { ethers } from "ethers";
import { MESSAGE, TYPE, Notifier } from "../notifcations";

export default function useSupervisor() {

  const history = useHistory();

  const { contracts, signer } = useWeb3({});

  const [supervisor, setSupervisor] = useState(); 

  const [loading, setLoading] = useState(false); 

  const [userDetails, setUserDetails] = useState(); 

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  useEffect(async () => {
    if(otusCloneFactory && !userDetails) {
      try {
        setLoading(true)
        const details = await otusCloneFactory.connect(signer).getUserManagerDetails();
        setUserDetails(details); 
      } catch (error) {
        console.log({ error })
      }
      setLoading(false)
    }
  }, [otusCloneFactory])

  useEffect(() => {
    if(userDetails) {
      console.log({ userDetails })
      if(
        userDetails['userSupervisor'] != ethers.constants.AddressZero && 
        userDetails['userVault'] != ethers.constants.AddressZero &&
        userDetails['userStrategy'] != ethers.constants.AddressZero
        ) {
        history.push(`/supervisors/${userDetails['userVault']}/${userDetails['userStrategy']}`);
      }

      if(
        userDetails['userSupervisor'] != ethers.constants.AddressZero && 
        userDetails['userVault'] == ethers.constants.AddressZero &&
        userDetails['userStrategy'] == ethers.constants.AddressZero
        ) {
        history.push(`/supervisors/vault_flow`);
      }

      if(
        userDetails['userSupervisor'] == ethers.constants.AddressZero && 
        userDetails['userVault'] == ethers.constants.AddressZero &&
        userDetails['userStrategy'] == ethers.constants.AddressZero
        ) {
        history.push(`/supervisors/flow`);
      }

    }
  }, [userDetails])

  const createSupervisor = async () => {
    try {
      setLoading(true);
      const response = await otusCloneFactory.connect(signer).cloneSupervisor(); 
      const receipt = await response.wait();

      setLoading(false);
      Notifier(MESSAGE.SUPERVISOR_CREATE.SUCCESS, TYPE.SUCCESS);
      history.push(`/supervisors/vault_flow`);

      setSupervisor(response); 
    } catch (e) {
      console.log(e); 
      Notifier(MESSAGE.SUPERVISOR_CREATE.ERROR, TYPE.ERROR);
      setLoading(false);
    }
  };

  return { loading, createSupervisor }

}
