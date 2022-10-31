export type TableVariant =
  | 'default' // bg gray border-gray
  | 'primary' // bg dark gradient no border

export type TableProps = {
  variant: TableVariant
  headers: JSX.Element
  children: any
}

export const getTableVariant = (variant: TableVariant): string => {
  switch (variant) {
    case 'default':
      return 'min-w-full md:rounded-sm bg-zinc-800 shadow-sm'
      break
    case 'primary':
      return 'min-w-full'
  }
}

export const getTableBodyVariant = (variant: TableVariant): string => {
  switch (variant) {
    case 'default':
      return 'divide-y divide-zinc-700'
      break
    case 'primary':
      return 'divide-y divide-zinc-700'
  }
}

export default function Table({ variant, headers, children }: TableProps) {
  const tableVariant = getTableVariant(variant)
  const tableBodyVariant = getTableBodyVariant(variant)

  return (
    <table className={tableVariant}>
      <thead>{headers}</thead>
      <tbody className={tableBodyVariant}>{children}</tbody>
    </table>
  )
}
