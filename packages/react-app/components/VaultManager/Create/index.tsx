import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'

import {
  CREATE_STEPS,
  CREATE_STEP_LINKS,
  CREATE_STEP_STATUS,
} from '../../../constants/tabs'
import { Input } from '../../UI/Components/Input/Input'
import { RangeSlider } from '../../UI/Components/RangeSlider'
import { Switch } from '../../UI/Components/Switch'
import { TextArea } from '../../UI/Components/TextArea'
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

export type StrategyDetailStruct = {
  hedgeReserve: BigNumber
  collatBuffer: BigNumber
  collatPercent: BigNumber
  minTimeToExpiry: number
  maxTimeToExpiry: number
  minTradeInterval: number
  gwavPeriod: number
  allowedMarkets: BytesLike[]
}

const vaultParamsStep = {
  cap: 1000,
}
const vaultParamsMin = {
  cap: 1000,
}
const vaultParamsMax = {
  cap: 100000,
}

const vaultInfoStep = {
  performanceFee: 0.01,
  managementFee: 0.01,
}
const vaultInfoMin = {
  performanceFee: 0,
  managementFee: 0,
}
const vaultInfoMax = {
  performanceFee: 0.1,
  managementFee: 0.1,
}

const vaultStrategyStep = {
  collatBuffer: 0.05,
  collatPercent: 0.05,
  hedgeReserve: 0.05,
  minTimeToExpiry: HOUR_SEC,
  maxTimeToExpiry: HOUR_SEC,
  minTradeInterval: 10,
  gwavPeriod: 10,
}
const vaultStrategyMin = {
  collatBuffer: 0.75,
  collatPercent: 0.25,
  hedgeReserve: 0,
  minTimeToExpiry: 0,
  maxTimeToExpiry: WEEK_SEC,
  minTradeInterval: 0,
  gwavPeriod: 0,
}
const vaultStrategyMax = {
  collatBuffer: 2,
  collatPercent: 1,
  hedgeReserve: 0.5,
  minTimeToExpiry: WEEK_SEC,
  maxTimeToExpiry: WEEK_SEC * 8,
  minTradeInterval: DAY_SEC,
  gwavPeriod: HOUR_SEC,
}

export default function Create({ setOpen, open }) {
  const { signer, address, network } = useWeb3Context()
  const contracts = useContracts()
  const otusControllerContract = contracts ? contracts['OtusController'] : null
  const monitorTransaction = useTransactionNotifier()
  const router = useRouter()

  const routeToVault = (href: string) => {
    router.push(`vault-manager/${href}`)
  }

  const CREATE_STEPS = [
    {
      id: 1,
      name: 'Vault Information & Settings',
      href: CREATE_STEP_LINKS.INFORMATION,
      status: CREATE_STEP_STATUS.CURRENT,
      isActive: true,
    },
    {
      id: 2,
      name: 'Vault Strategy',
      href: CREATE_STEP_LINKS.STRATEGY,
      status: CREATE_STEP_STATUS.UPCOMING,
      isActive: false,
    },
  ]

  const [steps, setSteps] = useState(CREATE_STEPS)
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
    asset: '0x2400D0469bfdA59FB0233c3027349D83F1a0f4c8', // quote asset
  })

  const [vaultStrategy, setVaultStrategy] = useState<StrategyDetailStruct>({
    hedgeReserve: toBN('.15'), // limit up to 50%
    collatBuffer: toBN('1.2'),
    collatPercent: toBN('.35'),
    minTimeToExpiry: DAY_SEC,
    maxTimeToExpiry: WEEK_SEC * 4,
    minTradeInterval: HOUR_SEC / 6,
    gwavPeriod: HOUR_SEC / 6,
    allowedMarkets: [
      '0x7345544800000000000000000000000000000000000000000000000000000000',
    ],
  })

  const handleCreateVault = useCallback(async () => {
    console.log({ otusControllerContract })
    if (otusControllerContract == null || address == null || signer == null) {
      console.warn('Otus Controller not Available')
      return null
    }

    setIsCreating(true)

    console.log({
      vaultInfo,
      vaultParams,
      vaultStrategy,
    })
    const tx = await otusControllerContract.createOptionsVault(
      vaultInfo,
      vaultParams,
      vaultStrategy
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
            console.log({ vaultCloneAddress })

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
      isCreating={isCreating}
      handleCreateVault={handleCreateVault}
      setOpen={setOpen}
      open={open}
      title={'Create a Vault'}
    >
      <CreateSteps steps={steps} setSteps={setSteps} />
      <div className="py-4">
        <form className="space-y-4 divide-y divide-zinc-700">
          <div className="space-y-4">
            {steps.map((step) => {
              return (
                <>
                  {step.status == CREATE_STEP_STATUS.CURRENT &&
                  step.href == CREATE_STEP_LINKS.INFORMATION ? (
                    <div className="pt-8">
                      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <Input
                            showLabel={true}
                            label={'Name'}
                            type="text"
                            id="name"
                            onChange={(e) => {
                              console.log(e.target.value)
                              setVaultInfo((info) => ({
                                ...info,
                                name: e.target.value,
                              }))
                            }}
                            value={vaultInfo.name}
                            placeholder="Vault Name"
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <Input
                            showLabel={true}
                            label={'Token Name'}
                            type="text"
                            id="tokenName"
                            onChange={(e) => {
                              console.log(e.target.value)
                              setVaultInfo((info) => ({
                                ...info,
                                tokenName: e.target.value,
                              }))
                            }}
                            value={vaultInfo.tokenName}
                            placeholder="Token Name"
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <TextArea
                            showLabel={true}
                            label={'Token Description'}
                            id="tokenDescription"
                            onChange={(e) => {
                              console.log(e.target.value)
                              setVaultInfo((info) => ({
                                ...info,
                                description: e.target.value,
                              }))
                            }}
                            value={vaultInfo.description}
                            placeholder="Token Description"
                            radius={'xs'}
                            variant={'default'}
                            rows={2}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <Switch
                            label={'Is Pubilc'}
                            value={vaultInfo.isPublic}
                            onChange={(checked: any) => {
                              console.log({ checked })

                              setVaultInfo((vaultInfo) => ({
                                ...vaultInfo,
                                isPublic: checked,
                              }))
                            }}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultParamsStep.cap}
                            min={vaultParamsMin.cap}
                            max={vaultParamsMax.cap}
                            id={'cap'}
                            label={'Maximum Cap'}
                            value={fromBigNumber(vaultParams.cap)}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const cap = toBN(e.target.value)
                              setVaultParams((params) => ({
                                ...params,
                                cap,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultInfoStep.performanceFee}
                            min={vaultInfoMin.performanceFee}
                            max={vaultInfoMax.performanceFee}
                            id={'performance-fee'}
                            label={'Performance Fee'}
                            value={fromBigNumber(vaultInfo.performanceFee)}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const performanceFee = toBN(e.target.value)
                              setVaultInfo((params) => ({
                                ...params,
                                performanceFee,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultInfoStep.managementFee}
                            min={vaultInfoMin.managementFee}
                            max={vaultInfoMax.managementFee}
                            id={'management-fee'}
                            label={'Management Fee'}
                            value={fromBigNumber(vaultInfo.managementFee)}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const managementFee = toBN(e.target.value)
                              setVaultInfo((params) => ({
                                ...params,
                                managementFee,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step.status == CREATE_STEP_STATUS.CURRENT &&
                  step.href == CREATE_STEP_LINKS.STRATEGY ? (
                    <div className="pt-8">
                      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.collatBuffer}
                            min={vaultStrategyMin.collatBuffer}
                            max={vaultStrategyMax.collatBuffer}
                            id={'collateral-buffer'}
                            label={'Colalteral Buffer'}
                            value={fromBigNumber(vaultStrategy.collatBuffer)}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const collatBuffer = toBN(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                collatBuffer,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.collatPercent}
                            min={vaultStrategyMin.collatPercent}
                            max={vaultStrategyMax.collatPercent}
                            id={'collateral-percent'}
                            label={'Collateral Percent'}
                            value={fromBigNumber(vaultStrategy.collatPercent)}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const collatPercent = toBN(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                collatPercent,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.hedgeReserve}
                            min={vaultStrategyMin.hedgeReserve}
                            max={vaultStrategyMax.hedgeReserve}
                            id={'hedge-reserve'}
                            label={'Funds reserved for Hedging'}
                            value={fromBigNumber(vaultStrategy.hedgeReserve)}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const hedgeReserve = toBN(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                hedgeReserve,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.minTimeToExpiry}
                            min={vaultStrategyMin.minTimeToExpiry}
                            max={vaultStrategyMax.minTimeToExpiry}
                            id={'min-time-to-expiry'}
                            label={'Min. Time to Expiry'}
                            value={vaultStrategy.minTimeToExpiry}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const minTimeToExpiry = parseInt(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                minTimeToExpiry,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.maxTimeToExpiry}
                            min={vaultStrategyMin.maxTimeToExpiry}
                            max={vaultStrategyMax.maxTimeToExpiry}
                            id={'max-time-to-expiry'}
                            label={'Max Time to Expiry'}
                            value={vaultStrategy.maxTimeToExpiry}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const maxTimeToExpiry = parseInt(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                maxTimeToExpiry,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.minTradeInterval}
                            min={vaultStrategyMin.minTradeInterval}
                            max={vaultStrategyMax.minTradeInterval}
                            id={'min-trade-interval'}
                            label={'Min. Trade Interval'}
                            value={vaultStrategy.minTradeInterval}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const minTradeInterval = parseInt(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                minTradeInterval,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <RangeSlider
                            step={vaultStrategyStep.gwavPeriod}
                            min={vaultStrategyMin.gwavPeriod}
                            max={vaultStrategyMax.gwavPeriod}
                            id={'gwav-period'}
                            label={'GWAV Period'}
                            value={vaultStrategy.gwavPeriod}
                            onChange={(e) => {
                              console.log(e.target.value)
                              const gwavPeriod = parseInt(e.target.value)
                              setVaultStrategy((params) => ({
                                ...params,
                                gwavPeriod,
                              }))
                            }}
                            radius={'xs'}
                            variant={'default'}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )
            })}
          </div>
        </form>
      </div>
    </SlideInPanel>
  )
}
