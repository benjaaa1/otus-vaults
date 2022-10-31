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
        <div className="border-b border-zinc-700">
          <nav className="-mb-px flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                onClick={() => setTab(tab.href)}
                className={classNames(
                  tab.href == active
                    ? ' text-emerald-600'
                    : ' text-zinc-500  hover:text-zinc-200',
                  'w-1/2 cursor-pointer border-b border-zinc-700 py-4 px-1 text-center text-xxs font-semibold uppercase last:border-l'
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
