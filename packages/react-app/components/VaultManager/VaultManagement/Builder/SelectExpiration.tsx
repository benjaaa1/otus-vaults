import React, { Dispatch, Fragment } from 'react'
import { Listbox, Transition } from "@headlessui/react"
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { LyraBoard, LyraMarket } from '../../../../queries/lyra/useLyra'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const SelectBuilderExpiration = (
  {
    selectedMarket,
    selectedExpirationDate,
    setSelectedExpirationDate
  }:
    {
      selectedMarket: LyraMarket,
      selectedExpirationDate: LyraBoard | null | undefined,
      setSelectedExpirationDate: Dispatch<LyraBoard>
    }
) => {

  // const { selectedMarket, selectedExpirationDate, handleSelectedExpirationDate } = useBuilderContext();

  return <Listbox value={selectedExpirationDate} onChange={setSelectedExpirationDate}>
    {({ open }) => (
      <>
        <div className="relative sm:pl-2">
          <Listbox.Button className="rounded-xs relative min-w-full w-full cursor-default border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-10 text-left text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="block truncate">
              {selectedExpirationDate ? selectedExpirationDate.name : 'Expiration Date'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="rounded-xs absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {selectedMarket?.liveBoards.map((board: LyraBoard) => (
                <Listbox.Option
                  key={board.id}
                  className={({ active }) =>
                    classNames(
                      active ? 'bg-emerald-600 text-white' : 'text-white',
                      'relative cursor-default select-none py-2 pl-3 pr-9'
                    )
                  }
                  value={board}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">

                        <span
                          className={classNames(
                            selected ? 'font-semibold' : 'font-normal',
                            'block truncate'
                          )}
                        >
                          {board.name}
                        </span>
                      </div>

                      {selected ? (
                        <span
                          className={classNames(
                            active ? 'text-white' : 'text-indigo-600',
                            'absolute inset-y-0 right-0 flex items-center pr-4'
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </>
    )}
  </Listbox>
}