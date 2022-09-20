type nullableUndefinedString = string | null | undefined

export default function Stats({
  balance,
  yieldEarned,
  roi,
}: {
  balance: nullableUndefinedString
  yieldEarned: nullableUndefinedString
  roi: nullableUndefinedString
}) {
  return (
    <div className="py-4 sm:py-6 lg:py-8">
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Stat stat={balance} name={'Balance'} />
        <Stat stat={yieldEarned} name={'Yield Earned'} />
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
    <div className="overflow-hidden rounded-lg bg-dark-gray px-4 py-5 shadow sm:p-6">
      <dt className="truncate text-sm font-medium text-gray">{name}</dt>
      <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
        {stat != null ? <span>{stat}</span> : <span>---</span>}
      </dd>
    </div>
  )
}
