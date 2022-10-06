import { Spinner } from '../Spinner'

export type ButtonFontSize = 'xs' | 'sm' | 'md' | 'lg'

export type ButtonSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'full-sm'
  | 'full'
  | 'fixed-xs'
  | 'fixed-xxs'

export type ButtonRadius = 'xs' | 'md' | 'full'

export type ButtonVariant =
  | 'default' // bg trasnaparent border gray shadow dark
  | 'primary' // bg dark border gray shadow dark
  | 'action' // green border bg dark/gray
  | 'secondary'
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
  label: string | number
  variant: ButtonVariant
  radius: ButtonRadius
  size: ButtonSize
  isLoading?: boolean
  isActive?: boolean
  textColor?: string
} & BaseButtonProps

export const getButtonFontSize = (fontSize: ButtonFontSize): string => {
  switch (fontSize) {
    case 'xs':
      return 'text-xs font-normal'
    case 'sm':
      return 'text-sm'
    case 'md':
      return 'text-md'
    case 'lg':
      return 'text-lg'
  }
}

export const getButtonSize = (size: ButtonSize): string => {
  switch (size) {
    case 'xs':
      return 'text-xs font-normal px-4 py-2'
    case 'sm':
      return 'text-xs font-normal px-8 py-2'
    case 'md':
      return 'text-md font-normal px-12 py-3'
    case 'full-sm':
      return 'text-xs font-normal w-full px-12 py-2'
    case 'full':
      return 'text-md font-normal w-full px-12 py-3'
    case 'fixed-xs':
      return 'text-xs font-normal py-2 w-24'
    case 'fixed-xxs':
      return 'text-xxs font-normal py-1 w-20'
  }
}

export const getButtonVariant = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'default':
      return 'border border-zinc-700 bg-transparent shadow-sm hover:bg-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'primary':
      return 'border border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'action':
      return 'border border-emerald-600 bg-zinc-900 shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'secondary':
      return 'border border-orange-500 bg-transparent shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'error':
      return 'border border-emerald-200 bg-zinc-900 shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
    case 'warning':
      return 'border border-emerald-200 bg-zinc-900 shadow-sm hover:bg-black shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
  }
}

export const getButtonRadius = (radius: ButtonRadius): string => {
  switch (radius) {
    case 'xs':
      return 'rounded-sm'
    case 'md':
      return 'rounded-xl'
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
  isDisabled,
  textColor,
  isActive = false,
}: ButtonProps) => {
  const buttonSize = getButtonSize(size)
  const buttonVariant = getButtonVariant(variant)
  const buttonRadius = getButtonRadius(radius)
  const activeButton = isActive ? 'ring-2 ring-emerald-600' : ''
  const buttonTextColor = textColor ? textColor : 'text-white'
  return (
    <button
      disabled={isDisabled}
      className={`items-center ${buttonTextColor} ${buttonSize} ${buttonVariant} ${buttonRadius} ${activeButton}`}
      onClick={onClick}
    >
      {isLoading ? <Spinner /> : label}
    </button>
  )
}
