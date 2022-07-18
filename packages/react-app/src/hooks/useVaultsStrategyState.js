import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";
import { formatUnits } from "ethers/lib/utils";
import { getStrike } from "../helpers/lyra";

export default function useVaultStrategyState(vault) {

  const [contractAddresses, setContractAddresses] = useState({ OtusVault: vault }); 

  const { contracts } = useWeb3(contractAddresses);

  const otusVault = contracts ? contracts['OtusVault'] : "";
  const strategy = contracts ? contracts['Strategy'] : "";

  const [vaultInfo, setVaultInfo] = useState({
    currentBasePrice: 0,
    tokenName: '',
    tokenSymbol: '',
    name: '', 
    description: '', 
    isPublic: false,
    vaultState: {
      round: 0,
      lockedAmount: 0,
      lastLockedAmount: 0,
      totalPending: 0,
      queuedWithdrawShares: 0,
      nextRoundReadyTimestamp: 0,
      roundInProgress: false
    },
    vaultParams: {
      cap: 0,
      asset: 'eth'
    },
    strikes: [],
    currentAPR: 0, 

  })

  useEffect(async() => {
    if(otusVault) {
      try {
        const strategyAddress = await otusVault.strategy(); 
        setContractAddresses(prev => {
          return { ...prev, Strategy: strategyAddress }
        }); 

        const tokenName = await otusVault.name(); 
        const tokenSymbol = await otusVault.symbol(); 

        const vaultName = await otusVault.vaultName(); 

        const vaultDescription = await otusVault.vaultDescription(); 

        const isPublic = await otusVault.isPublic(); 

        const vp = await otusVault.vaultParams(); 

        setVaultInfo(ps => {
          const { vaultParams } = ps; 
          return { ...ps, 
            tokenName,
            tokenSymbol,
            name: vaultName, 
            description: vaultDescription, 
            isPublic: isPublic,
            vaultParams: {
              ...vaultParams, 
              cap: formatUnits(vp.cap)
            } 
          }
        })
        
        const vs = await otusVault.vaultState(); 
        const roundPremiumCollected = await otusVault.roundPremiumCollected();
        console.log({ roundPremiumCollected })
        const _currentAPR =  Math.round(formatUnits(roundPremiumCollected) * 52 / formatUnits(vs.lockedAmount) * 100); 
        console.log({ _currentAPR })
        setVaultInfo(ps => {
          const { vaultState } = ps; 
          return { ...ps, vaultState: {
              ...vaultState, 
              round: Math.round(parseFloat(formatUnits(vs.round) * (10**18))),
              lockedAmount: formatUnits(vs.lockedAmount),
              lastLockedAmount: formatUnits(vs.lastLockedAmount),
              totalPending: formatUnits(vs.totalPending),
              queuedWithdrawShares: formatUnits(vs.queuedWithdrawShares),
              nextRoundReadyTimestamp: formatUnits(vs.nextRoundReadyTimestamp),
              roundInProgress: vs.roundInProgress,
              currentAPR: _currentAPR || 0
            } 
          }
        })

      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVault])

  useEffect(async() => {
    if(strategy) {
      try {
        const currentBasePrice = await strategy.getSpotPriceForMarket(); 
        
        const [strikes, optionTypes, positionIds] = await strategy.getStrikeOptionTypes();

        const strikesInfo = await Promise.all(strikes.map(async (strikeId, index) => {
          const strike = await getStrike(Math.round(parseFloat(formatUnits(strikeId) * (10**18))));
          return {
            strikeId: strike.id, 
            positionId: Math.round(parseFloat(formatUnits(positionIds[index]) * (10 ** 18))),
            strikePrice: formatUnits(strike.strikePrice),
            optionType: Math.round(parseFloat(formatUnits(optionTypes[index]) * (10 ** 18)))
          }; 
        }))

        setVaultInfo(ps => {
          return { ...ps, strikes: strikesInfo, currentBasePrice: Math.round(parseFloat(formatUnits(currentBasePrice))) }
        })

      } catch (error) {
        console.log({ error })
      }
    }
  }, [strategy])

  return { vaultInfo }

}
