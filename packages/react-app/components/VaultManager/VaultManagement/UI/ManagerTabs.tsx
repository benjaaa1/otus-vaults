const tabs = [
  { name: 'Trade', href: 'trades' },
  { name: 'Current Round', href: 'current' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MangerTabs({ setTab, active }) {
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
          className="block w-full rounded-md border-gray focus:border-gray focus:ring-dark-gray"
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
                  ? 'bg-gray text-white'
                  : 'text-gray hover:text-dark-gray',
                'cursor-pointer rounded-md px-3 py-2 text-sm font-medium'
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
