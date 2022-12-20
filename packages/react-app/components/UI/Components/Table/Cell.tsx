import { Button } from '../Button'

export type CellButtonSize = 'fixed-xs' | 'fixed-xxs'

export type CellVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type CellDeviceVariant =
  | 'large'
  | 'default'

export type CellProps = {
  label: string | number
  isButton?: boolean
  deviceVariant?: CellDeviceVariant
  variant: CellVariant
  onClick?: any
  isSelected?: boolean
  buttonSize?: CellButtonSize
}

export const getCellVariant = (variant: CellVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-xxs whitespace-nowrap px-4 py-3 font-medium text-zinc-200'
      break
    case 'primary':
      return 'text-xxs whitespace-nowrap px-6 py-3 font-medium text-zinc-500'
  }
}

export const getMobileVariant = (variant: CellDeviceVariant): string => {
  switch (variant) {
    case 'large':
      return 'hidden sm:block'
    case 'default':
      return ''
      break;
  }
}

export const Cell = ({
  deviceVariant = 'default',
  variant,
  label,
  isButton = false,
  isSelected = false,
  onClick,
  buttonSize,
}: CellProps) => {
  const cellVariant = getCellVariant(variant)
  const cellMobileVariant = getMobileVariant(deviceVariant);

  return (
    <td className={`${cellVariant} ${cellMobileVariant}`}>
      {isButton ? (
        <Button
          label={label}
          onClick={onClick}
          isActive={isSelected}
          size={buttonSize || 'fixed-xs'}
          radius={'full'}
          variant={'primary'}
        />
      ) : (
        label
      )}
    </td>
  )
}
