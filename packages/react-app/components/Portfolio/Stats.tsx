import { BigNumber, BigNumberish } from 'ethers'
import { useUserPortfolio } from '../../queries/portfolio/useUserPortfolio'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'

type nullableUndefinedString = string | null | undefined

export default function Stats() {
  const { data, isLoading } = useUserPortfolio()

  const balance: BigNumber | undefined = data?.balance
  const yieldEarned: BigNumber | undefined = data?.yieldEarned
  const roi = null

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        </div>
      </div>
      <div className="mt-6 border border-zinc-700 bg-gradient-to-b from-black to-zinc-900 p-9">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Stat
            stat={
              balance ? formatUSD(fromBigNumber(balance), { maxDps: 0 }) : null
            }
            name={'Balance'}
          />
          <Stat
            stat={
              yieldEarned
                ? formatUSD(fromBigNumber(yieldEarned), { maxDps: 0 })
                : null
            }
            name={'Yield Earned'}
          />
          <Stat stat={roi} name={'ROI'} />
        </dl>
      </div>
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
    <div>
      <dd className="font-mono text-3xl font-normal tracking-tight text-zinc-200">
        {stat != null ? <span>{stat}</span> : <span>---</span>}
      </dd>
      <dt className="mt-2 items-end truncate text-xxs font-medium uppercase text-white">
        {name}
      </dt>
    </div>
  )
}
