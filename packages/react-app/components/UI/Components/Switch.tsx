import { useState } from 'react'
import { Switch as SwitchHeadlessUI } from '@headlessui/react'

export const Switch = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: any
}) => {

  return (
    <SwitchHeadlessUI.Group>
      <div>
        <SwitchHeadlessUI.Label className="block mb-1 text-xs text-zinc-200 font-normal">
          {label}
        </SwitchHeadlessUI.Label>
        <SwitchHeadlessUI
          checked={value}
          onChange={onChange}
          className={`${value ? 'bg-emerald-600' : 'bg-zinc-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          <span
            className={`${value ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-zinc-500 transition-transform`}
          />
        </SwitchHeadlessUI>
      </div>
    </SwitchHeadlessUI.Group>
  )
}
