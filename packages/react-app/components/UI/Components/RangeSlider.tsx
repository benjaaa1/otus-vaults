import React, { ChangeEventHandler, FocusEventHandler } from 'react'

export type InputVariant =
  | 'default' // bg trasnaparent border gray shadow dark
  | 'primary' // bg dark border gray shadow dark

export type InputRadius = 'xs' | 'md' | 'full'

export type HTMLInputProps = {
  value: string | number | readonly string[] | undefined
  placeholder?: string
  onChange: ChangeEventHandler<HTMLInputElement>
  onFocus?: FocusEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  autoFocus?: boolean
  type?: string
}

export type InputProps = {
  id: string
  label?: string
  error?: false | string
  isSuccess?: boolean
  onError?: (error: false | string | null) => void
  isDisabled?: boolean
  radius: InputRadius
  variant: InputVariant
  style?: string
  min: number
  max: number
  step: number
} & HTMLInputProps

export const RangeSlider = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: InputProps) => {
  return (
    <>
      <label
        htmlFor="medium-range"
        className="mb-2 block text-xs font-normal text-zinc-200"
      >
        {label}: {value}
      </label>
      <input
        data-tooltip-target="tooltip-default"
        min={min}
        max={max}
        step={step}
        id={id}
        type="range"
        value={value}
        onChange={onChange}
        className=" mb-6 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 dark:bg-gray-700"
      ></input>
    </>
  )
}
