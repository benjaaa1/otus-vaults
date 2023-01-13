import { Vault, VaultTrade } from "./vault"

export type Manager = {
  id: string
  twitter: string
  vaults: Vault[]
  managerActions: ManagerAction[]
}

export type ManagerAction = {
  id: string
  trade: VaultTrade
}

export type ManagerVault = {
  vaults?: Vault[]
  isLoading: boolean
  isSuccess: boolean
}