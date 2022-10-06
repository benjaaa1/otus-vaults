import { MegaphoneIcon } from '@heroicons/react/24/outline'
import React from 'react'

export default function NetworkSwitch() {
  return (
    <div className="fixed z-50 inset-x-0 bottom-0 pb-2 sm:pb-5">
      <div className="mx-auto max-w-6xl px-2 sm:px-6 lg:px-8">
        <div className="rounded-sm border-zinc-700 bg-zinc-800 p-2 shadow-lg sm:p-3">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex w-0 flex-1 items-center">
              <span className="flex rounded-lg bg-emerald-600 p-2">
                <MegaphoneIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </span>
              <p className="ml-3 truncate font-medium text-white">
                <span className="hidden md:inline">
                  Your wallet is not connected to Optimism.
                </span>
              </p>
            </div>
            <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
              <a
                onClick={() => console.log('switch')}
                className="flex items-center justify-center border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-900"
              >
                Switch to Optimism
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
