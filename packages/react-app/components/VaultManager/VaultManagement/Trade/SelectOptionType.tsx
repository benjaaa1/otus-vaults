import { Dispatch, Fragment, useState } from 'react'

function activeClasses(active: boolean) {
  if (active) {
    return 'border-gray-300 bg-black text-gray hover:bg-gray-50 relative inline-flex cursor-pointer items-center border px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
  }

  return 'border-gray-300 text-gray-700 hover:bg-gray-50 relative inline-flex cursor-pointer items-center border bg-white px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
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
      </div>
      <div>
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
    </div>
  )
}
