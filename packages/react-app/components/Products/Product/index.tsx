import { Fragment, useState } from 'react'
import { Menu, Popover, Transition } from '@headlessui/react'
import {
  ArrowLongLeftIcon,
  CheckIcon,
  HandThumbUpIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  QuestionMarkCircleIcon,
  UserIcon,
} from '@heroicons/react/20/solid'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useVaultProduct } from '../../../queries/vaults/useVaultProducts'
import { useRouter } from 'next/router'
import Transact from './Transact'
import { UserActionTabs } from '../../../constants/tabs'
import Deposit from './Deposit'

export default function Product() {
  const { query } = useRouter()
  const { data: vault, isLoading } = useVaultProduct(query?.vault)
  console.log({ vault })

  // on vault page must display
  // title
  // token symbol - token name
  // status and asset
  // Vault Strategy: description
  // Vault Snapshot: other details like premium + current price + expiry + strikes traded (table)
  // vault performance: current apy and previous week
  // Vault Transactions (manager actions + hedges):

  const [tab, setTab] = useState(UserActionTabs.DEPOSIT.HREF)

  return (
    <>
      <div className="h-full">
        <main className="py-10">
          {/* Page header */}
          <div className="mx-auto max-w-3xl md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-2xl font-bold text-zinc-200">
                  {vault?.name || <span>---</span>}
                </h1>
                <p className="btext-zinc-500 text-sm font-medium">
                  Applied for{' '}
                  <a href="#" className="text-zinc-200">
                    Front End Developer
                  </a>{' '}
                  on <time dateTime="2020-08-25">August 25, 2020</time>
                </p>
              </div>
            </div>
            <div className="justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
              >
                Disqualify
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
              >
                Advance to offer
              </button>
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 lg:max-w-6xl lg:grid-flow-col-dense lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2 lg:col-start-1">
              {/* Description list*/}
              <section aria-labelledby="applicant-information-title">
                <div className="border border-zinc-700 bg-zinc-800 shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h2
                      id="applicant-information-title"
                      className="text-lg font-medium leading-6 text-zinc-200"
                    >
                      Vault Strategy
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                      {vault?.description || <span>---</span>}
                    </p>
                  </div>
                  <div className="border-t border-zinc-700 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-zinc-500">
                          Application for
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-200">
                          Backend Developer
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-zinc-500">
                          Email address
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-200">
                          ricardocooper@example.com
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="btext-zinc-500 text-sm font-medium">
                          Salary expectation
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-200">$120,000</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-zinc-500">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-200">
                          +1 555-555-5555
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-zinc-500">
                          About
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-200">
                          Fugiat ipsum ipsum deserunt culpa aute sint do nostrud
                          anim incididunt cillum culpa consequat. Excepteur qui
                          ipsum aliquip consequat sint. Sit id mollit nulla
                          mollit nostrud in ea officia proident. Irure nostrud
                          pariatur mollit ad adipisicing reprehenderit deserunt
                          qui eu.
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>
            </div>

            <section
              aria-labelledby="timeline-title"
              className="lg:col-span-1 lg:col-start-3"
            >
              <div className="border border-zinc-700 bg-zinc-800 px-4 py-5 shadow sm:rounded-lg sm:px-6">
                {/* transact */}
                <div className="flow-root">
                  <Transact setTab={setTab} active={tab} />
                </div>
                <div className="flow-root">
                  {tab === UserActionTabs.DEPOSIT.HREF ? (
                    <Deposit />
                  ) : (
                    <Deposit />
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}
