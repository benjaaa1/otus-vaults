export type HeaderCellVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type HeaderCellProps = {
  label: string
  variant: HeaderCellVariant
}

export const getHeaderCellVariant = (variant: HeaderCellVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-xxs uppercase px-4 py-3 text-left font-semibold text-white/50'
      break
    case 'primary':
      return 'text-xxs uppercase px-4 py-3 text-left font-semibold text-white/50'
  }
}

export const HeaderCell = ({ variant, label }: HeaderCellProps) => {
  const headerCellVariant = getHeaderCellVariant(variant)

  return (
    <th scope="col" className={headerCellVariant}>
      {label}
    </th>
  )
}
