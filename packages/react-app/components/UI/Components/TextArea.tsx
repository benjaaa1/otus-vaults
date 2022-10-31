import React, { ChangeEventHandler, FocusEventHandler } from 'react'

export type TextAreaVariant =
  | 'default' // bg trasnaparent border gray shadow dark
  | 'primary' // bg dark border gray shadow dark

export type TextAreaRadius = 'xs' | 'md' | 'full'

export type HTMLTextAreaProps = {
  rows: number
  value: string | number | readonly string[] | undefined
  placeholder?: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
  onFocus?: FocusEventHandler<HTMLTextAreaElement>
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  autoFocus?: boolean
}

export type TextAreaProps = {
  id: string
  label?: string
  error?: false | string
  isSuccess?: boolean
  onError?: (error: false | string | null) => void
  isDisabled?: boolean
  style?: string
  variant: TextAreaVariant
  radius: TextAreaRadius
  showLabel: boolean
} & HTMLTextAreaProps

export const getTextAreaVariant = (variant: TextAreaVariant): string => {
  switch (variant) {
    case 'default':
      return 'w-full border-zinc-700 bg-zinc-900 text-white text-xs shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
    case 'primary':
      return 'border-zinc-700 bg-zinc-900 text-white text-xs shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
  }
}

export const getTextAreaRadius = (radius: TextAreaRadius): string => {
  switch (radius) {
    case 'xs':
      return 'rounded-sm'
    case 'md':
      return 'rounded-xl'
    case 'full':
      return 'rounded-full'
  }
}
export const TextArea = ({
  id,
  label,
  rows,
  onChange,
  value,
  placeholder,
  variant,
  radius,
  showLabel,
}: TextAreaProps) => {
  const textAreaVariant = getTextAreaVariant(variant)
  const textAreaRadius = getTextAreaRadius(radius)
  const labelStyle = showLabel ? 'text-xs text-zinc-200 font-normal' : 'sr-only'

  return (
    <>
      <label htmlFor={id} className={labelStyle}>
        {label}
      </label>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={rows}
          onChange={onChange}
          className={`block ${textAreaVariant} ${textAreaRadius}`}
          value={value}
          placeholder={placeholder}
        />
      </div>
    </>
  )
}
