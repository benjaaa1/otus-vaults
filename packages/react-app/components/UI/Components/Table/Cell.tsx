import { Button } from '../Button'

export type CellVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type CellProps = {
  label: string | number
  isButton?: boolean
  variant: CellVariant
  onClick?: any
  isSelected?: boolean
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

export const Cell = ({
  variant,
  label,
  isButton = false,
  isSelected = false,
  onClick,
}: CellProps) => {
  const cellVariant = getCellVariant(variant)

  return (
    <td className={cellVariant}>
      {isButton ? (
        <Button
          label={label}
          onClick={onClick}
          isActive={isSelected}
          size={'fixed-xs'}
          radius={'full'}
          variant={'primary'}
        />
      ) : (
        label
      )}
    </td>
  )
}
