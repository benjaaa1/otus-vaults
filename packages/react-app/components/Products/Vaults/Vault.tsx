import { useRouter } from 'next/router'
import React from 'react'
import { Vault } from '../../../queries/myVaults/useMyVaults'
import ETHBWIcon from '../../UI/Components/Icons/BW/ETHBWIcon'
import SUSDIcon from '../../UI/Components/Icons/Color/SUSD'
import { Tag } from '../../UI/Components/Tag'

const Vault = ({ vault }: { vault: Vault }) => {
  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <div
      onClick={(e) => handleVaultClick(e, `vault/${vault.id}`)}
      key={vault.id}
      className="cursor-pointer rounded-sm border border-zinc-800 bg-gradient-to-b from-black to-zinc-900 shadow-black hover:shadow-lg hover:shadow-emerald-600"
    >
      <div key={vault.id} className="overflow-hidden border-b border-zinc-800">
        <div className="p-4 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Tag
                label={'Put Selling'}
                textVariant={'uppercase'}
                size={'sm'}
                variant={'primary'}
              />
            </div>
            <div>
              <SUSDIcon />
            </div>
            <div className="py-4">
              <Tag label={'No Hedge'} size={'xs'} variant={'default'} />
            </div>
          </div>
          <div className="sm:absolute sm:ml-48 sm:mt-[-8px]">
            <ETHBWIcon />
          </div>
        </div>
      </div>

      <div className="overflow-hidden border-b border-zinc-800">
        <div className="p-4 pt-8">
          <div className="truncate font-mono text-xs font-semibold uppercase text-white">
            {vault.name}
          </div>
          <div className="grid grid-cols-2">
            <div className="py-2">
              <div className="py-2 font-mono text-2xl font-normal text-white">
                10.2%
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Current Projected Apy
              </div>
            </div>

            <div className="py-2">
              <div className="py-2 font-mono text-2xl font-normal text-white">
                $1200
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Current Strike Price
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="py-2">
              <div className="py-2 font-mono text-lg font-normal text-white">
                0%
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Management Fees
              </div>
            </div>

            <div className="py-2">
              <div className="py-2 font-mono text-lg font-normal text-white">
                0%
              </div>
              <div className="text-xxs font-light text-zinc-300">
                Performance Fees
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap justify-between py-2">
          <div className="text-xxs font-light text-white">Total Deposits</div>
          <div className="font-mono text-xxs font-normal text-white">
            $80000
          </div>
        </div>
        <div className="rounded-xs h-3 w-full bg-zinc-800">
          <div className="progress-bar h-3 w-5/12 bg-emerald-600"></div>
        </div>
        <div className="flex flex-wrap justify-between py-2">
          <div className="text-xxs font-light text-white">Maximum Capacity</div>
          <div className="font-mono text-xxs font-normal text-white">
            $120000
          </div>
        </div>
      </div>

      {/* <p className="text-sm font-medium text-gray">{vault.name}</p>
        <p className="truncate text-sm text-gray">{vault.description}</p>
        <p className="truncate text-sm text-gray">{vault.strategy}</p>
        <p className="truncate text-sm text-gray">{vault.isPublic}</p>
        <p className="truncate text-sm text-gray">{vault.manager}</p>
        <p className="truncate text-sm text-gray">{vault.vaultCap}</p>
        <p className="truncate text-sm text-gray">{vault.asset}</p> */}
    </div>
  )
}

export default Vault
