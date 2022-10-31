import { useVaultManagerContext } from '../../../../context'
import CloseExecute from './CloseExecute'
import HedgeExecute from './HedgeExecute'

export const CurrentExecute = ({ strategyId }: { strategyId: string }) => {
  const { builtStrikeToHedge, builtStrikeToClose } = useVaultManagerContext()
  return builtStrikeToHedge != null || builtStrikeToClose != null ? (
    <>
      {builtStrikeToHedge ? <HedgeExecute strategyId={strategyId} /> : null}

      {builtStrikeToClose ? <CloseExecute /> : null}
    </>
  ) : (
    <div className="h-10 border border-zinc-800 bg-transparent"></div>
  )
}
