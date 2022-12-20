export type HeaderCellVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type HeaderDeviceCellVariant =
  | 'default'
  | 'large'

export type HeaderCellProps = {
  label: string
  variant: HeaderCellVariant
  deviceVariant?: HeaderDeviceCellVariant
}

export const getHeaderCellVariant = (variant: HeaderCellVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-xxs uppercase px-4 py-3 text-left font-semibold text-white/50'
    case 'primary':
      return 'text-xxs uppercase px-6 py-3 text-left font-semibold text-zinc-500'
  }
}

export const getHeaderDeviceCellVariant = (variant: HeaderDeviceCellVariant): string => {
  switch (variant) {
    case 'large':
      return 'hidden sm:table-cell'
    case 'default':
      return ''
  }
}

export const HeaderCell = ({ deviceVariant = 'default', variant, label }: HeaderCellProps) => {
  const headerCellVariant = getHeaderCellVariant(variant)
  const headerCellDeviceVariant = getHeaderDeviceCellVariant(deviceVariant);

  return (
    <th scope="col" className={`${headerCellVariant} ${headerCellDeviceVariant}`}>
      {label}
    </th>
  )
}
