import { VaultManagerTabs } from '../../../../constants/tabs'

const tabs = [
  { name: VaultManagerTabs.TRADE.TITLE, href: VaultManagerTabs.TRADE.HREF },
  { name: VaultManagerTabs.CURRENT.TITLE, href: VaultManagerTabs.CURRENT.HREF },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ManagerTabs({ setTab, active }) {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="border-gray focus:border-gray block w-full rounded-md focus:ring-zinc-900"
          defaultValue={tabs.find((tab) => tab.href == active).name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <a
              key={tab.name}
              onClick={() => setTab(tab.href)}
              className={classNames(
                tab.href == active
                  ? 'bg-zinc-700 text-zinc-400'
                  : 'text-zinc-400 hover:text-gray-700',
                'text-md cursor-pointer rounded-md px-3 py-2 font-semibold'
              )}
              aria-current={tab.href == active ? 'page' : undefined}
            >
              {tab.name}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
