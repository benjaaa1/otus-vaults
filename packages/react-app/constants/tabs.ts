export const VaultManagerTabs = {
  TRADE: {
    TITLE: 'Trade',
    HREF: 'trade',
  },
  CURRENT: {
    TITLE: 'Current Round',
    HREF: 'current',
  },
}

export const UserActionTabs = {
  DEPOSIT: {
    TITLE: 'Deposit',
    HREF: 'deposit',
  },
  WITHDRAW: {
    TITLE: 'Withdraw',
    HREF: 'withdraw',
  },
}

export enum CREATE_STEP_LINKS {
  INFORMATION = 'INFORMATION',
  STRATEGY = 'STRATEGIES',
}

export enum CREATE_STEP_STATUS {
  CURRENT = 'CURRENT',
  UPCOMING = 'UPCOMING',
  COMPLETE = 'COMPLETE',
}

export const CREATE_STEPS = [
  {
    id: 1,
    name: 'Vault Information & Settings',
    href: CREATE_STEP_LINKS.INFORMATION,
    status: CREATE_STEP_STATUS.CURRENT,
  },
  {
    id: 2,
    name: 'Vault Strategy',
    href: CREATE_STEP_LINKS.STRATEGY,
    status: CREATE_STEP_STATUS.UPCOMING,
  },
]
