import { useState, useEffect } from 'react'
import { loadAppContracts } from '../helpers/loadAppContracts'
import { useContractLoader } from 'eth-hooks'
import { useWeb3Context } from '../context'
import { useVaultProducts } from '../queries/vaults/useVaultProducts'
import { Contract } from 'ethers'

export const useContractConfig = () => {
  const [contractsConfig, setContractsConfig] = useState({})
  const vaultProducts = useVaultProducts()
  const data = vaultProducts?.data;

  useEffect(() => {

    const loadFunc = async () => {
      const result = await loadAppContracts()
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
  const vaultProducts = useVaultProducts()
  const data = vaultProducts?.data;
  const [otusContracts, setOtusContracts] = useState({})

  useEffect(() => {
    if (data?.vaults && contracts['OtusVault'] && contracts['Strategy']) {
      const otusVaultContract = contracts['OtusVault']
      const strategyContract = contracts['Strategy']
      const attachedContracts = data?.vaults?.reduce((accum, { id, strategy: { id: strategyId } }) => {
        return { ...accum, [id]: otusVaultContract.attach(id), [strategyId]: strategyContract.attach(strategyId) }
      }, {})
      setOtusContracts(attachedContracts)
    }
  }, [data, contracts])

  return otusContracts
}