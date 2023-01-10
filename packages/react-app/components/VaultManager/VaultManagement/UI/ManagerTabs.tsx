import { Dispatch } from 'react';
import { VaultManagerTabs } from '../../../../constants/tabs'

const tabs = [
  { name: VaultManagerTabs.BUILD.TITLE, href: VaultManagerTabs.BUILD.HREF },
  { name: VaultManagerTabs.TRADE.TITLE, href: VaultManagerTabs.TRADE.HREF },
  { name: VaultManagerTabs.CURRENT.TITLE, href: VaultManagerTabs.CURRENT.HREF },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ManagerTabs({ setTab, active }: { setTab: Dispatch<string>, active: string }) {
  return (
    <div className='min-w-full'>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="border-gray focus:border-gray block w-full rounded-md focus:ring-zinc-900"
          defaultValue={tabs.find((tab) => tab.href == active)?.name}
          onChange={(e) => {
            if (e.target.value == 'Build') {
              setTab(VaultManagerTabs.BUILD.HREF)
            } else if (e.target.value == 'Trade') {
              setTab(VaultManagerTabs.TRADE.HREF)
            } else {
              setTab(VaultManagerTabs.CURRENT.HREF)
            }
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="">
          <nav className="flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                onClick={() => setTab(tab.href)}
                className={classNames(
                  tab.href == active
                    ? ' text-emerald-600'
                    : ' text-zinc-500  hover:text-zinc-200',
                  'w-1/2 cursor-pointer border-b border-zinc-700 py-4 px-1 text-center text-xs font-bold uppercase first:border-r last:border-l'
                )}
                aria-current={tab.href == active ? 'page' : undefined}
              >
                {tab.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
