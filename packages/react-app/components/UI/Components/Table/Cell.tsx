import { Button } from '../Button'

export type CellVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type CellProps = {
  label: string
  isButton?: boolean
  variant: CellVariant
  onClick?: any
}

export const getCellVariant = (variant: CellVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-xxs whitespace-nowrap p-4 font-medium text-zinc-200'
      break
    case 'primary':
      return 'text-xxs whitespace-nowrap p-4 font-medium text-zinc-200'
  }
}

export const Cell = ({
  variant,
  label,
  isButton = false,
  onClick,
}: CellProps) => {
  const cellVariant = getCellVariant(variant)

  return (
    <td className={cellVariant}>
      {isButton ? (
        <Button
          label={label}
          onClick={onClick}
          size={'xs'}
          radius={'full'}
          variant={'primary'}
        />
      ) : (
        label
      )}
    </td>
  )
}
