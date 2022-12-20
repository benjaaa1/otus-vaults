import { Dispatch, Fragment, useState } from 'react'

function activeClasses(active: boolean) {
  if (active) {
    return 'bg-emerald-600 border-zinc-800 bg-transparent text-white relative inline-flex cursor-pointer items-center border px-4 py-2 text-sm font-normal focus:z-10 focus:border-black focus:outline-none focus:ring-1 focus:ring-black'
  }

  return 'border-zinc-800 text-zinc-200 hover:bg-transparent relative inline-flex cursor-pointer items-center border bg-zinc-900 px-4 py-2 text-sm font-normal'
}

export default function SelectOptionType({
  isLong,
  isCall,
  setLong,
  setCall,
}: {
  isLong: boolean
  isCall: boolean
  setLong: Dispatch<any>
  setCall: Dispatch<any>
}) {
  return (
    <div className="grid gap-1 grid-cols-2">
      <span className="isolate inline-flex shadow-sm border-top">
        <div
          onClick={() => setLong(true)}
          className={`${activeClasses(isLong)} rounded-l-full`}
        >
          Buy
        </div>
        <div
          onClick={() => setLong(false)}
          className={`${activeClasses(!isLong)} -ml-px rounded-r-full`}
        >
          Sell
        </div>
      </span>

      <span className="isolate inline-flex">
        <div
          onClick={() => setCall(true)}
          className={`${activeClasses(isCall)} rounded-l-full`}
        >
          Call
        </div>
        <div
          onClick={() => setCall(false)}
          className={`${activeClasses(!isCall)} -ml-px rounded-r-full`}
        >
          Put
        </div>
      </span>
    </div>
  )
}
