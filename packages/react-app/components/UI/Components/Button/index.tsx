import { Spinner } from '../Spinner'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'full'

export type ButtonRadius = 'xs' | 'full'

export type ButtonVariant =
  | 'default' // bg trasnaparent border gray shadow dark
  | 'primary' // bg dark border gray shadow dark
  | 'action' // green border bg dark/gray
  | 'error' // red border bg dark/gray
  | 'warning' // red border bg dark

export type BaseButtonProps = {
  size?: ButtonSize
  target?: string
  href?: string
  onClick: any
  isOutline?: boolean
  isDisabled?: boolean
  isTransparent?: boolean
  type?: string
  textVariant?: 'uppercase' | 'lowercase'
}

export type ButtonProps = {
  label: string
  variant: ButtonVariant
  radius: ButtonRadius
  size: ButtonSize
  isLoading?: boolean
} & BaseButtonProps

export const getButtonSize = (size: ButtonSize): string => {
  switch (size) {
    case 'xs':
      return 'text-xs font-normal px-4 py-2'
    case 'sm':
      return 'text-xs font-normal px-8 py-2'
    case 'md':
      return 'text-md font-normal px-12 py-3'
    case 'full':
      return 'text-md font-normal w-full px-12 py-3'
  }
}

export const getButtonVariant = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-white border border-zinc-700 bg-transparent shadow-sm hover:bg-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'primary':
      return 'text-white border border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'action':
      return 'text-white border border-emerald-200 bg-zinc-900 shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'error':
      return 'text-white border border-emerald-200 bg-zinc-900 shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'warning':
      return 'text-white border border-emerald-200 bg-zinc-900 shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
  }
}

export const getButtonRadius = (radius: ButtonRadius): string => {
  switch (radius) {
    case 'xs':
      return 'rounded-sm'
    case 'full':
      return 'rounded-full'
  }
}

export const Button = ({
  label,
  isLoading = false,
  variant,
  radius,
  size,
  onClick,
}: ButtonProps) => {
  const buttonSize = getButtonSize(size)
  const buttonVariant = getButtonVariant(variant)
  const buttonRadius = getButtonRadius(radius)

  return isLoading ? (
    <button>
      <Spinner />
    </button>
  ) : (
    <button
      className={`items-center ${buttonSize} ${buttonVariant} ${buttonRadius}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
