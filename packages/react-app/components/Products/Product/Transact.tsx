import { UserActionTabs } from '../../../constants/tabs'

const tabs = [
  { name: UserActionTabs.DEPOSIT.TITLE, href: UserActionTabs.DEPOSIT.HREF },
  { name: UserActionTabs.WITHDRAW.TITLE, href: UserActionTabs.WITHDRAW.HREF },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Transact({ setTab, active }) {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          defaultValue={tabs.find((tab) => tab.href == active).name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                onClick={() => setTab(tab.href)}
                className={classNames(
                  tab.href == active
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'w-1/2 border-b-2 py-4 px-1 text-center text-sm font-medium'
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
