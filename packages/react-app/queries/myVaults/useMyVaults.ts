import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { BigNumber, BigNumberish } from 'ethers'
import { lyra } from '../lyra/useLyra';
import { AccountPortfolioBalance, PositionPnl } from '@lyrafinance/lyra-js'
import { fromBigNumber } from '../../utils/formatters/numbers'
import { ZERO_BN } from '../../constants/bn'

export type VaultTrade = {
  id: string
  txhash: string
  strikeId: string
  positionId: string
  premiumEarned: BigNumber
  strikePrice: BigNumber
  size: BigNumber
  optionType: number
  openedAt: number
  expiry: number
  position: CurrentPosition
}

export type VaultStrategy = {
  id: string
  allowedMarkets: string[]
  collatBuffer: BigNumber
  collatPercent: BigNumber
  minTimeToExpiry: number
  maxTimeToExpiry: number
  minTradeInterval: number
  gwavPeriod: number
}

type Strategy = {
  id: string
  latestUpdate: number
  hedgeType: number
  vaultStrategy: VaultStrategy
}

export type Vault = {
  id: string
  createdAt: string | any
  manager: string
  round: number
  isActive: boolean
  isPublic: boolean
  strategy: Strategy
  vaultTrades: VaultTrade[]
  name: string
  description: string
  inProgress: boolean
  totalDeposit: BigNumber
  performanceFee: BigNumber
  managementFee: BigNumber
  asset: string
  vaultCap: BigNumber
}

type ManagerVault = {
  vaults?: Vault[]
  isLoading: boolean
  isSuccess: boolean
}

export const useMyVaults = () => {
  const { address: managerId, network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network)

  return useQuery<ManagerVault>(
    QUERY_KEYS.Vaults.ManagerVaults(managerId?.toLowerCase()),
    async () => {
      if (!managerId) return null
      console.log({ managerId })
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
      console.log({ response })
      return response ? response : null
    },
    {
      enabled: !!managerId,
    }
  )
}

export const useMyVault = (vaultId: any) => {
  const { address: managerId, network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<Vault | null>(
    QUERY_KEYS.Vaults.ManageMyVault(
      managerId?.toLowerCase(),
      vaultId?.toLowerCase()
    ),
    async () => {
      if (!managerId) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($managerId: String!, $vaultId: String!) {
            vaults(where: { manager: $managerId, id: $vaultId }) {
              id
              round
              createdAt
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
              strategy {
                id
                latestUpdate
                hedgeType
                vaultStrategy {
                  id
                  collatBuffer
                  collatPercent
                  minTimeToExpiry
                  maxTimeToExpiry
                  minTradeInterval
                  gwavPeriod
                  allowedMarkets
                }
              }
              vaultTrades {
                id
                txhash
                strikeId
                positionId
                premiumEarned
                strikePrice
                openedAt
                expiry
                optionType
              }
            }
          }
        `,
        { managerId: managerId?.toLowerCase(), vaultId: vaultId?.toLowerCase() }
      )

      // const account = lyra.account(vaultId);
      // const portfolio: AccountPortfolioBalance = await account.portfolioBalance();
      // const positions: CurrentPosition[] = portfolio.positions.map((position) => {
      //   const { isOpen, id, strikeId, size } = position;
      //   const _breakEven = fromBigNumber(position.breakEven());
      //   const { unrealizedPnlPercentage, settlementPnl }: PositionPnl = position.pnl();
      //   return {
      //     id,
      //     strikeId,
      //     size,
      //     breakEven: _breakEven,
      //     settlementPnl,
      //     isActive: isOpen,
      //   }
      // });

      const vaults = response.vaults.length > 0 ?
        prepareMyVault(
          [
            {
              id: 1,
              strikeId: 1,
              breakEven: 10,
              profitPercentage: .9,
              size: ZERO_BN,
              settlementPnl: ZERO_BN,
              isActive: true
            }
          ],
          response.vaults[0]
        ) : null;

      return vaults;

    },
    {
      enabled: !!managerId && !!vaultId,
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

  console.log({ positionsById })

  const vaultTradesDetail = vaultTrades.map(vaultTrade => {
    const { positionId } = vaultTrade;
    console.log({ positionId })
    const position = positionId != null ? positionsById[parseInt(positionId)] : {
      id: 0,
      strikeId: 0,
      breakEven: 0,
      size: ZERO_BN,
      settlementPnl: ZERO_BN,
      profitPercentage: 0,
      isActive: false
    };
    console.log({ position })
    return { ...vaultTrade, position }
  })

  console.log({ vaultTradesDetail });

  return { ...vault, vaultTrades: vaultTradesDetail }
}