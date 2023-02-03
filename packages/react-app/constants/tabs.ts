export const VaultManagerTabs = {
  BUILD: {
    TITLE: 'Build',
    HREF: 'build',
  },
  TRADE: {
    TITLE: 'Trade',
    HREF: 'trade',
  },
  CURRENT: {
    TITLE: 'Current Round',
    HREF: 'current',
  },
  NEXT: {
    TITLE: 'Signal',
    HREF: 'signal',
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

export enum CREATE_STEP_TITLE {
  INFORMATION = 'Vault Information & Settings',
  STRATEGY = 'Vault Strategy',
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
    name: CREATE_STEP_TITLE.INFORMATION,
    href: CREATE_STEP_LINKS.INFORMATION,
    status: CREATE_STEP_STATUS.CURRENT,
    isActive: true,
  },
  {
    id: 2,
    name: CREATE_STEP_TITLE.STRATEGY,
    href: CREATE_STEP_LINKS.STRATEGY,
    status: CREATE_STEP_STATUS.UPCOMING,
    isActive: false,
  },
]
