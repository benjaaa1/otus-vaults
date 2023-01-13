export type Manager = {
  id: string
  twitter: string
}

export type ManagerVault = {
  vaults?: Vault[]
  isLoading: boolean
  isSuccess: boolean
}