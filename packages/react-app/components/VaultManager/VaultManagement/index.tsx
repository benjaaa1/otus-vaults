import { useState } from 'react'
import { useRouter } from 'next/router'
import { useMyVault } from '../../../queries/myVaults/useMyVaults'
import ManagerTabs from './UI/ManagerTabs'
import Trade from './Trade'
import Current from './Current'
import { VaultManagerTabs } from '../../../constants/tabs'
import { VaultManagerContextProvider } from '../../../context'
import TradeExecute from './Trade/TradeExecute'

export default function VaultManagement() {
  const { query } = useRouter()
  console.log({ vault: query?.vault })
  const { data, isLoading } = useMyVault(query?.vault)

  const [tab, setTab] = useState(VaultManagerTabs.CURRENT.HREF)

  return (
    <VaultManagerContextProvider>
      <div className="h-screen">
        <main className="py-10">
          {/* Page header */}
          <div className="mx-auto max-w-3xl md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-gray text-2xl font-bold">
                  {data?.name || <span>--</span>}
                </h1>
                <p className="text-sm font-medium text-white">
                  Vault Management
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 border-zinc-700 lg:max-w-6xl lg:grid-flow-col-dense lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2 lg:col-start-1">
              {/* Active Strike list */}
              <section aria-labelledby="strike-selection-current">
                <div className="border border-zinc-700 bg-zinc-800 shadow sm:rounded-lg">
                  <div className="px-4 py-6 sm:px-6">
                    {/** add tab here */}
                    <ManagerTabs setTab={setTab} active={tab} />
                  </div>
                  <div className="border-t border-zinc-700">
                    <div className="sm:col-span-2">
                      {tab === VaultManagerTabs.TRADE.HREF ? (
                        <Trade />
                      ) : (
                        <Current />
                      )}
                    </div>
                  </div>
                  {tab === VaultManagerTabs.CURRENT.HREF ? (
                    <div>
                      <a
                        onClick={() => setTab(VaultManagerTabs.TRADE.HREF)}
                        className="block  bg-teal-500 px-4 py-4 text-center text-sm font-medium text-gray-500 hover:text-gray-700 sm:rounded-b-lg"
                      >
                        Add strike
                      </a>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Historical vault trade details */}
              {/* <section aria-labelledby="notes-title">
                <div className="bg-white shadow sm:overflow-hidden sm:rounded-lg">
                  <div className="divide-y divide-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                      <h2
                        id="notes-title"
                        className="text-lg font-medium text-gray-900"
                      >
                        Transaction History
                      </h2>
                    </div>
                    <div className="px-4 py-6 sm:px-6">
                      <ul role="list" className="space-y-8">
                        {comments.map((comment) => (
                          <li key={comment.id}>
                            <div className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={`https://images.unsplash.com/photo-${comment.imageId}?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`}
                                  alt=""
                                />
                              </div>
                              <div>
                                <div className="text-sm">
                                  <a
                                    href="#"
                                    className="font-medium text-gray-900"
                                  >
                                    {comment.name}
                                  </a>
                                </div>
                                <div className="mt-1 text-sm text-gray-700">
                                  <p>{comment.body}</p>
                                </div>
                                <div className="mt-2 space-x-2 text-sm">
                                  <span className="font-medium text-gray-500">
                                    {comment.date}
                                  </span>{' '}
                                  <span className="font-medium text-gray-500">
                                    &middot;
                                  </span>{' '}
                                  <button
                                    type="button"
                                    className="font-medium text-gray-900"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-6 sm:px-6">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.imageUrl}
                          alt=""
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <form action="#">
                          <div>
                            <label htmlFor="comment" className="sr-only">
                              About
                            </label>
                            <textarea
                              id="comment"
                              name="comment"
                              rows={3}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Add a note"
                              defaultValue={''}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <a
                              href="#"
                              className="group inline-flex items-start space-x-2 text-sm text-gray-500 hover:text-gray-900"
                            >
                              <QuestionMarkCircleIcon
                                className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                              />
                              <span>Some HTML is okay.</span>
                            </a>
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Comment
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </section> */}
            </div>

            <section
              aria-labelledby="timeline-title"
              className="lg:col-span-1 lg:col-start-3"
            >
              <div className="shadow sm:rounded-lg">
                <TradeExecute />

                <div className="justify-stretch mt-6 flex flex-col">
                  <button
                    type="button"
                    className="focus:ring-dark-green  inline-flex items-center justify-center rounded-md border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    Execute Trade
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </VaultManagerContextProvider>
  )
}
