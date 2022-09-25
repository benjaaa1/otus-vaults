import React, { ChangeEventHandler, FocusEventHandler } from 'react'

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
  variant?: string
  label?: string
  error?: false | string
  isSuccess?: boolean
  onError?: (error: false | string | null) => void
  rightContent?: React.ReactNode
  icon?: React.ReactNode
  isDisabled?: boolean
  textAlign?:
    | 'start'
    | 'end'
    | 'left'
    | 'right'
    | 'center'
    | 'justify'
    | 'match-parent'
  isTransparent?: boolean
} & HTMLInputProps

export const Input = ({
  label,
  rightContent,
  icon,
  error,
  isSuccess: success,
  onError,
  value,
  onChange,
  placeholder,
  autoFocus,
  type,
  onBlur,
  onFocus,
  isDisabled,
  textAlign,
}: InputProps) => {
  return (
    <>
      <label
        htmlFor="street-address"
        className="block text-sm font-medium text-zinc-500"
      >
        {label}
      </label>
      <div className="mt-1">
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          type={type}
          disabled={isDisabled}
          name="token-name"
          id="token-name"
          autoComplete="token-name"
          className="block w-full rounded-md border-zinc-700 bg-zinc-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </>
  )
}
