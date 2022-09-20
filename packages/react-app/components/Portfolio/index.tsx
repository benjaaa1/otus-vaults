import { BigNumber, ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useUserPortfolio } from '../../queries/portfolio/useUserPortfolio'
import Positions from './Positions'
import Stats from './Stats'
import Transactions from './Transactions'

export default function UserPortfolio() {
  const { data, isLoading } = useUserPortfolio()
  console.log({ data, isLoading })
  // const userPortfolio = data;

  // const balance = data?. || BigNumber.from('0')
  return (
    <div className="relative pt-8 pb-8">
      <Stats
        balance={data?.balance}
        yieldEarned={data?.yieldEarned}
        roi={null}
      />
      <Positions />
      <Transactions actions={data?.userActions} />
    </div>
  )
}
