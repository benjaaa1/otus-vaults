import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'

import {
  CREATE_STEPS,
  CREATE_STEP_LINKS,
  CREATE_STEP_STATUS,
} from '../../../constants/tabs'
import CreateSteps from './CreateSteps'
import SlideInPanel from './SlideInPanel'
import { BigNumber, BigNumberish } from 'ethers/lib/ethers'
import { ZERO_BN } from '../../../constants/bn'
import { BytesLike, parseUnits } from 'ethers/lib/utils'
import { fromBigNumber, toBN } from '../../../utils/formatters/numbers'
import { DAY_SEC, HOUR_SEC, WEEK_SEC } from '../../../constants/period'
import { useWeb3Context } from '../../../context'
import { useContracts } from '../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../hooks/TransactionNotifier'
import { BYTES32_MARKET } from '../../../constants/markets'
import { CURRENCIES } from '../../../constants/currency'
import StrategyForm from './CreateForm/StrategyForm'
import InformationForm from './CreateForm/InformationForm'

export type VaultInformationStruct = {
  name: string
  tokenName: string
  tokenSymbol: string
  description: string
  isPublic: boolean
  performanceFee: BigNumber
  managementFee: BigNumber
}

export type VaultParamsStruct = {
  decimals: number
  cap: BigNumber
  asset: string
}

export type VaultStrategyStruct = {
  hedgeReserve: BigNumber
  collatBuffer: BigNumber
  collatPercent: BigNumber
  minTimeToExpiry: number
  maxTimeToExpiry: number
  minTradeInterval: number
  gwavPeriod: number
  allowedMarkets: BytesLike[]
}

export default function Create({ setOpen, open }: { setOpen: any, open: any }) {
  const { signer, address, network } = useWeb3Context()
  const contracts = useContracts()

  const otusControllerContract = contracts ? contracts['OtusController'] : null
  const monitorTransaction = useTransactionNotifier()
  const [step, setStep] = useState(CREATE_STEPS[0].id)

  const router = useRouter()

  const routeToVault = (href: string) => {
    router.push(`vault-manager/${href}`)
  }

  const [isCreating, setIsCreating] = useState(false)

  const [vaultInfo, setVaultInfo] = useState<VaultInformationStruct>({
    name: '',
    tokenName: '',
    tokenSymbol: '',
    description: '',
    isPublic: false,
    performanceFee: ZERO_BN,
    managementFee: ZERO_BN,
  })

  const [vaultParams, setVaultParams] = useState<VaultParamsStruct>({
    decimals: 18,
    cap: toBN('50000'),
    asset: CURRENCIES[network?.chainId || 420].ETH, // quote asset
  })

  const [vaultStrategy, setVaultStrategy] = useState<VaultStrategyStruct>({
    hedgeReserve: toBN('.15'), // limit up to 50%
    collatBuffer: toBN('1.2'),
    collatPercent: toBN('.35'),
    minTimeToExpiry: DAY_SEC,
    maxTimeToExpiry: WEEK_SEC * 4,
    minTradeInterval: HOUR_SEC / 6,
    gwavPeriod: HOUR_SEC / 6,
    allowedMarkets: [],
  })

  const handleCreateVault = useCallback(async () => {

    if (otusControllerContract == null || address == null || signer == null) {
      console.warn('Otus Controller not Available')
      return null
    }

    setIsCreating(true)

    const tx = await otusControllerContract.createOptionsVault(
      vaultInfo,
      vaultParams,
      vaultStrategy,
      {
        gasLimit: 1600000
      }
    )
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(async () => {
            // navigate to created vault
            const vaultCloneAddress = await otusControllerContract._getVaults(
              address
            )
            setIsCreating(false)
            routeToVault(vaultCloneAddress[vaultCloneAddress.length - 1])
          }, 5 * 1000)
        },
      })
    }
  }, [
    otusControllerContract,
    address,
    signer,
    monitorTransaction,
    vaultInfo,
    vaultParams,
    vaultStrategy,
  ])

  return (
    <SlideInPanel
      step={step}
      setStep={setStep}
      isCreating={isCreating}
      handleCreateVault={handleCreateVault}
      setOpen={setOpen}
      open={open}
      title={'Create a Vault'}
    >
      <CreateSteps step={step} setStep={setStep} />
      <div className="py-4">
        <form className="space-y-4 divide-y divide-zinc-700">
          <div className="space-y-4">

            {
              step === 1 ? // information 2 is strategy
                <InformationForm
                  vaultParams={vaultParams}
                  setVaultParams={setVaultParams}
                  vaultInfo={vaultInfo}
                  setVaultInfo={setVaultInfo}
                /> :
                <StrategyForm
                  vaultStrategy={vaultStrategy}
                  setVaultStrategy={setVaultStrategy}
                />
            }

          </div>
        </form>
      </div>
    </SlideInPanel>
  )
}
