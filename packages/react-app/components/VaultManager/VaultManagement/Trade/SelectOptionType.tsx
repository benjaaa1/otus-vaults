import { Dispatch, Fragment, useState } from 'react'

function activeClasses(active: boolean) {
  if (active) {
    return 'border-zinc-700 bg-zinc-800 text-white relative inline-flex cursor-pointer items-center border px-4 py-2 text-sm font-medium focus:z-10 focus:border-black focus:outline-none focus:ring-1 focus:ring-black'
  }

  return 'border-zinc-700 text-zinc-200 hover:bg-zinc-800 relative inline-flex cursor-pointer items-center border bg-zinc-700 px-4 py-2 text-sm font-medium'
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
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
      <span className="isolate inline-flex rounded-md shadow-sm">
        <div
          onClick={() => setLong(true)}
          className={`${activeClasses(isLong)} rounded-l-md`}
        >
          Buy
        </div>
        <div
          onClick={() => setLong(false)}
          className={`${activeClasses(!isLong)} -ml-px rounded-r-md`}
        >
          Sell
        </div>
      </span>

      <span className="isolate inline-flex rounded-md shadow-sm">
        <div
          onClick={() => setCall(true)}
          className={`${activeClasses(isCall)} rounded-l-md`}
        >
          Call
        </div>
        <div
          onClick={() => setCall(false)}
          className={`${activeClasses(!isCall)} -ml-px rounded-r-md`}
        >
          Put
        </div>
      </span>
    </div>
  )
}
