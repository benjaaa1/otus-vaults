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
} & HTMLInputProps

export const getInputVariant = (variant: InputVariant): string => {
  switch (variant) {
    case 'default':
      return 'w-full border-zinc-700 bg-zinc-900 text-white text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
    case 'primary':
      return 'border-zinc-700 bg-zinc-900 text-white text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
  }
}

export const getInputRadius = (radius: InputRadius): string => {
  switch (radius) {
    case 'xs':
      return 'rounded-sm'
    case 'md':
      return 'rounded-xl'
    case 'full':
      return 'rounded-full'
  }
}

export const Input = ({
  id,
  label,
  isSuccess: success,
  onError,
  value,
  onChange,
  placeholder,
  type,
  isDisabled,
  radius,
  variant,
  style = '',
}: InputProps) => {
  const inputVariant = getInputVariant(variant)
  const inputRadius = getInputRadius(radius)

  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      disabled={isDisabled}
      name={id}
      id={id}
      autoComplete={id}
      className={`block ${inputVariant} ${inputRadius} ${style}`}
    />
  )
}
