import React from 'react'
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
    { vaultParams: VaultParamsStruct, setVaultParams: any, vaultInfo: VaultInformationStruct, setVaultInfo: any }
) {

  return (
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
          <Input
            showLabel={true}
            label={'Token Symbol'}
            type="text"
            id="tokenSymbol"
            onChange={(e) => {
              console.log(e.target.value)
              setVaultInfo((info) => ({
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
  )
}
