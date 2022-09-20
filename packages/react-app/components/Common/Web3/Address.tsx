import Blockies from 'react-blockies'

type nullableUndefinedString = string | null | undefined

export const MyBlockies = ({
  address,
}: {
  address: nullableUndefinedString
}) => <Blockies seed={address} size={10} scale={3} className="identicon" />
