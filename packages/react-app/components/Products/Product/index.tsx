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
import { Button } from '../../UI/Components/Button'

export default function Product() {
  const { query } = useRouter()
  const { data: vault, isLoading } = useVaultProduct(query?.vault)
  console.log({ vault })
  const [tab, setTab] = useState(UserActionTabs.DEPOSIT.HREF)

  return (
    <>
      <div className="h-full">
        <main className="py-8">
          <div className="mx-auto max-w-3xl text-white md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-3xl font-bold uppercase text-zinc-200">
                  {vault?.name || <span>---</span>}
                </h1>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-8 py-8">
            <div className="col-span-7 grid grid-cols-1 rounded-sm border border-zinc-700 bg-gradient-to-b from-black to-zinc-900 p-9">
              <div className="py-2">
                <div className="text-xxs font-bold uppercase text-zinc-300">
                  Strategy Description
                </div>
                <div className="py-4 text-xs font-normal text-zinc-300">
                  {vault?.description || '---'}
                </div>
              </div>
              <div className="py-2">
                <span className="round text-xxs font-bold uppercase text-zinc-300">
                  Current Strategies
                </span>
                <div className="grid grid-cols-3 py-4">
                  <div>
                    <Button
                      label="Vault Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => console.log('test')}
                    />
                  </div>
                  <div>
                    <Button
                      label="Strike Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => console.log('test')}
                    />
                  </div>
                  <div>
                    {' '}
                    <Button
                      label="Hedge Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => console.log('test')}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 py-4">
                <div className="py-4 text-sm font-bold uppercase text-zinc-400">
                  Vault Snapshot
                </div>
                <div className="grid grid-cols-3">
                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Current Projected Apy
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      10.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Previous Week Performance
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      0.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Cumulative Yield
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      -12.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Premium Collected
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      $291.00
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Expiry
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      October 8, 2022
                    </div>
                  </div>
                </div>
                {/* <div>
                  <div>Strikes</div>
                  <div className="grid grid-cols-5">
                    <div>$1200</div>
                    <div>$1300</div>
                    <div>$1400</div>
                  </div>
                </div> */}
                <div className="py-2">
                  <div className="grid grid-cols-4">
                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Managed By
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white"></div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Management Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        0%
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Performance Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        0%
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Platform Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        0%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-5">
              <div className="rounded-sm border border-zinc-700 bg-zinc-800 shadow shadow-black">
                <Transact setTab={setTab} active={tab} />
                {tab == UserActionTabs.DEPOSIT.HREF ? (
                  <Deposit vault={vault} />
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
