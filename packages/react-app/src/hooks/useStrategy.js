import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";
import { useParams } from "react-router-dom";

export default function useStrategy() {

  const { vault } = useParams();

  const { contracts } = useWeb3({});

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  const [strategyAddress, setStrategyAddress] = useState(''); 

  const [loading, setLoading] = useState(false); 

  useEffect(async () => {
    if(otusCloneFactory) {
      try {
        setLoading(true); 
        const strategy = await otusCloneFactory._getStrategy(vault); 
        console.log({ strategy, vault })
        setStrategyAddress(strategy); 
        setLoading(false);
      } catch (error) {
        console.log({ error })
        setLoading(false);
      }
    }
  }, [otusCloneFactory])

  return { loading, strategyAddress }; 

}
