import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { BigNumber, BigNumberish } from 'ethers'
import { AccountPortfolioBalance, PositionPnl } from '@lyrafinance/lyra-js'
import { fromBigNumber } from '../../utils/formatters/numbers'
import { ZERO_BN } from '../../constants/bn'
import { getLyra, useLyra } from '../lyra/useLyra'
import { getMyVault } from '../../pages/api/subgraph'
import { ManagerVault } from '../../utils/types/manager'
import { StrikeStrategy, Vault } from '../../utils/types/vault'

export const useMyVaults = () => {
  const { address: managerId, network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network)

  return useQuery<ManagerVault>(
    QUERY_KEYS.Vaults.ManagerVaults(managerId?.toLowerCase()),
    async () => {
      if (!managerId) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($managerId: String!) {
            vaults(where: { manager: $managerId }) {
              id
              createdAt
              manager
              round
              isActive
              isPublic
              inProgress
              strategy
              name
              description
              totalDeposit
              performanceFee
              managementFee
              asset
              vaultCap
            }
          }
        `,
        { managerId: managerId.toLowerCase() }
      )
      return response ? response : null
    },
    {
      enabled: !!managerId,
    }
  )
}

export const useMyVault = (vaultId: any) => {
  const lyra = getLyra();

  const { address: managerId, network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<Vault | null>(
    QUERY_KEYS.Vaults.ManageMyVault(
      managerId?.toLowerCase(),
      vaultId?.toLowerCase()
    ),
    async () => {
      if (!managerId) return null

      const response = await getMyVault(otusEndpoint, vaultId)


      let positions: CurrentPosition[];

      if (network && (network.chainId === 420 || network.chainId === 10)) {
        const _positions = await lyra.positions(vaultId);
        // const portfolio: AccountPortfolioBalance = await account.portfolioBalance();
        positions = _positions.map((position) => {
          const { isOpen, id, strikeId, size } = position;
          const _breakEven = fromBigNumber(position.breakEven());
          const { unrealizedPnlPercentage, settlementPnl }: PositionPnl = position.pnl();
          return {
            id,
            strikeId,
            size,
            breakEven: _breakEven,
            profitPercentage: .9,
            settlementPnl,
            isActive: isOpen,
          }
        });
      } else {
        // local testing
        positions = [
          {
            id: 2,
            strikeId: 1,
            breakEven: 10,
            profitPercentage: .9,
            size: ZERO_BN,
            settlementPnl: ZERO_BN,
            isActive: true
          }
        ]
      }

      const vaults = response.vaults.length > 0 ?
        prepareMyVault(positions, response.vaults[0]) : null;

      return vaults;

    },
    {
      enabled: !!managerId && !!vaultId,
    }
  )
}

export const useMyVaultStrikeStrategies = (strategyId: string) => {
  const { network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<StrikeStrategy[]>(
    QUERY_KEYS.Vaults.ManageStrikeStrategies(
      strategyId?.toLowerCase()
    ),
    async () => {
      if (!strategyId) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($strategyId: String!) {
            strikeStrategies(where:{ strategy: $strategyId }) {
              id,
              targetDelta, 
              maxDeltaGap,
              minVol,
              maxVol,
              maxVolVariance,
              optionType
            }
          }
        `,
        { strategyId: strategyId?.toLowerCase() }
      )

      return response.strikeStrategies.map((strategy: StrikeStrategy) => {
        const { optionType } = strategy;
        return { ...strategy, optionType: typeof (optionType) == 'string' ? parseInt(optionType) : optionType }
      });

    },
    {
      enabled: !!strategyId,
    }
  )
}

export type CurrentPosition = {
  id: number
  strikeId: number
  breakEven: number
  size: BigNumber
  settlementPnl: BigNumber
  profitPercentage: number
  isActive: boolean
}

type PositionId = {
  [key: string]: CurrentPosition
}

const prepareMyVault = (positions: CurrentPosition[], vault: Vault): Vault => {

  const { vaultTrades } = vault;

  const positionsById: PositionId = positions.reduce((accum, position) => {
    const id = position.id;
    return { ...accum, [id.toString()]: position }
  }, {});


  const vaultTradesDetail = vaultTrades.map(vaultTrade => {
    const { positionId } = vaultTrade;

    const position = positionId != null ? positionsById[parseInt(positionId)] : {
      id: 0,
      strikeId: 0,
      breakEven: 0,
      size: ZERO_BN,
      settlementPnl: ZERO_BN,
      profitPercentage: 0,
      isActive: false
    };

    return { ...vaultTrade, position }
  });

  return { ...vault, vaultTrades: vaultTradesDetail }
}