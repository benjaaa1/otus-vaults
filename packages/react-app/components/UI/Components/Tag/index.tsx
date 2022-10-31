export type TagSize = 'xs' | 'sm' | 'fixed-xs'

export type TagVariant = // primary - green / orange small ligher

    | 'default' // bg trasnaparent border gray shadow dark
    | 'primary' // bg dark border gray shadow dark
    | 'secondary'

export type TagProps = {
  label: string | number
  variant: TagVariant
  size: TagSize
  isLoading?: boolean
  isActive?: boolean
  textVariant?: 'uppercase' | 'lowercase'
}

export const getTagSize = (size: TagSize): string => {
  switch (size) {
    case 'xs':
      return 'text-xxs font-light px-2 py-1'
    case 'sm':
      return 'text-xs font-normal px-2 py-2'
    case 'fixed-xs':
      return 'text-xs font-normal py-2 w-24'
  }
}

export const getTagVariant = (variant: TagVariant): string => {
  switch (variant) {
    case 'default':
      return 'text-white border-2 border-zinc-700 bg-transparent shadow-sm hover:bg-zinc-900'
    case 'primary':
      return 'text-white border-2 border-emerald-600 bg-transparent shadow-sm hover:bg-zinc-900'
    case 'secondary':
      return 'text-white border-2 border-orange-500 bg-transparent shadow-sm hover:bg-black'
  }
}

export const Tag = ({
  label,
  isLoading = false,
  variant,
  size,
  isActive = false,
  textVariant,
}: TagProps) => {
  const tagSize = getTagSize(size)
  const tagVariant = getTagVariant(variant)

  return (
    <div
      className={`text-center ${tagSize} ${tagVariant} rounded-full ${textVariant}`}
    >
      {label}
    </div>
  )
}
