import { BigNumber } from 'ethers'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'

type nullableUndefinedString = string | null | undefined

export default function Stats({
  balance,
  yieldEarned,
  roi,
}: {
  balance: BigNumber
  yieldEarned: BigNumber
  roi: nullableUndefinedString
}) {
  return (
    <div className="py-4 sm:py-6 lg:py-8">
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Stat
          stat={balance ? formatUSD(fromBigNumber(balance)) : null}
          name={'Balance'}
        />
        <Stat
          stat={yieldEarned ? formatUSD(fromBigNumber(yieldEarned)) : null}
          name={'Yield Earned'}
        />
        <Stat stat={roi} name={'ROI'} />
      </dl>
    </div>
  )
}

const Stat = ({
  stat,
  name,
}: {
  stat: nullableUndefinedString
  name: nullableUndefinedString
}) => {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 p-14 px-4 py-5 shadow sm:p-6">
      <dt className="up truncate text-sm font-medium text-white">{name}</dt>
      <dd className="mt-1 font-mono text-3xl font-semibold tracking-tight text-zinc-200">
        {stat != null ? <span>{stat}</span> : <span>---</span>}
      </dd>
    </div>
  )
}
