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
  console.log({ contracts, contractsConfig })
  return contracts
}

export const useOtusVaultContracts = (): Record<string, Contract> => {
  const contracts = useContracts()
  const { signer } = useWeb3Context()
  const { data } = useVaultProducts()
  const [otusContracts, setOtusContracts] = useState({})

  useEffect(() => {
    console.log({ contracts })
    if (data?.vaults && contracts['OtusVault']) {
      const contract = contracts['OtusVault']
      const _vaultIds = data?.vaults?.reduce((accum, { id }) => {
        return { ...accum, [id]: contract.attach(id) }
      }, {})
      setOtusContracts(_vaultIds)
    }
  }, [data, contracts])

  return otusContracts
}
