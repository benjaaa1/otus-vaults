import React, { Dispatch } from 'react'
import { useRouter } from 'next/router'

import { Input } from '../../../UI/Components/Input/Input'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { Switch } from '../../../UI/Components/Switch'
import { TextArea } from '../../../UI/Components/TextArea'

import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { VaultInformationStruct, VaultParamsStruct } from '..'

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

export default function InformationForm(
  { vaultParams, setVaultParams, vaultInfo, setVaultInfo }:
    { vaultParams: VaultParamsStruct, setVaultParams: any, vaultInfo: VaultInformationStruct, setVaultInfo: Dispatch<any> }
) {

  return (
    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
      <div className="sm:col-span-6">
        <Input
          showLabel={true}
          label={'Vault Name'}
          type="text"
          id="name"
          onChange={(e) => {
            setVaultInfo((info: VaultInformationStruct) => ({
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
            setVaultInfo((info: VaultInformationStruct) => ({
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
        <Input
          showLabel={true}
          label={'Token Symbol'}
          type="text"
          id="tokenSymbol"
          onChange={(e) => {
            setVaultInfo((info: VaultInformationStruct) => ({
              ...info,
              tokenSymbol: e.target.value,
            }))
          }}
          value={vaultInfo.tokenSymbol}
          placeholder="TOKEN-SYMBOL"
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
            setVaultInfo((info: VaultInformationStruct) => ({
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
            setVaultInfo((vaultInfo: VaultInformationStruct) => ({
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
            const cap = toBN(e.target.value)
            setVaultParams((params: VaultParamsStruct) => ({
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
            const performanceFee = toBN(e.target.value)
            setVaultInfo((params: VaultInformationStruct) => ({
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
            const managementFee = toBN(e.target.value)
            setVaultInfo((params: VaultInformationStruct) => ({
              ...params,
              managementFee,
            }))
          }}
          radius={'xs'}
          variant={'default'}
        />
      </div>
    </div>

  )
}
