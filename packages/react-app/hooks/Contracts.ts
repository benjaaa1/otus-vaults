import { useState, useEffect } from 'react'
import { loadAppContracts } from '../helpers/loadAppContracts'
import externalContracts from '../contracts/external_contracts'
import deployedContracts from '../contracts/hardhat_contracts.json'
import { useContractLoader } from 'eth-hooks'
import { useWeb3Context } from '../context'
import { useVaultProducts } from '../queries/vaults/useVaultProducts'
import { Contract, ethers } from 'ethers'

export const useContractConfig = () => {
  const [contractsConfig, setContractsConfig] = useState({})
  const { data, isLoading } = useVaultProducts()

  useEffect(() => {
    const loadFunc = async () => {
      const result = await loadAppContracts()
      console.log({ result })
      setContractsConfig(result)
    }
    void loadFunc()
  }, [data])

  return contractsConfig
}

export const useContracts = () => {
  const contractsConfig = useContractConfig()
  const { signer, network } = useWeb3Context()
  const contracts = useContractLoader(signer, contractsConfig, network?.chainId)
  return contracts
}

export const useOtusContracts = (): Record<string, Contract> => {
  const contracts = useContracts()
  const { signer } = useWeb3Context()
  const { data } = useVaultProducts()
  const [otusContracts, setOtusContracts] = useState({})

  useEffect(() => {
    console.log({ contracts })
    if (data?.vaults && contracts['OtusVault'] && contracts['Strategy']) {
      const otusVaultContract = contracts['OtusVault']
      const strategyContract = contracts['OtusVault']
      const attachedContracts = data?.vaults?.reduce((accum, { id, strategy: { id: strategyId } }) => {
        return { ...accum, [id]: otusVaultContract.attach(id), [strategyId]: strategyContract.attach(strategyId) }
      }, {})
      console.log({ attachedContracts })
      setOtusContracts(attachedContracts)
    }
  }, [data, contracts])

  return otusContracts
}