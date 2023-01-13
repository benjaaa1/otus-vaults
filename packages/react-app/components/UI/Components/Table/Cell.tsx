import { ReactElement } from 'react'
import { Button } from '../Button'

export type CellButtonSize = 'fixed-xs' | 'fixed-xxs'

export type CellVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type CellDeviceVariant =
  | 'large'
  | 'default'

export type CellProps = {
  label: string | number | ReactElement
  isButton?: boolean
  deviceVariant?: CellDeviceVariant
  variant: CellVariant
  onClick?: any
  isSelected?: boolean
  isIcon?: boolean
  buttonSize?: CellButtonSize
}

export const getCellVariant = (variant: CellVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-xxs whitespace-nowrap px-4 py-3 font-medium text-zinc-200'
      break
    case 'primary':
      return 'text-xxs whitespace-nowrap px-6 py-3 font-medium text-zinc-200'
  }
}

export const getMobileVariant = (variant: CellDeviceVariant): string => {
  switch (variant) {
    case 'large':
      return 'hidden sm:table-cell'
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
  isIcon = false,
  onClick,
  buttonSize,
}: CellProps) => {
  const cellVariant = getCellVariant(variant)
  const cellMobileVariant = getMobileVariant(deviceVariant);

  if (isIcon) {
    return <td className={`${cellVariant} ${cellMobileVariant}`}>
      {label}
    </td>
  }

  return (
    <td className={`${cellVariant} ${cellMobileVariant}`}>
      {isButton && !isIcon ? (
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
