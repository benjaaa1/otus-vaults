import { Dispatch, Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { LyraBoard } from '../../../../queries/lyra/useLyra'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SelectExpiry({
  boards,
  selectedExpiry,
  setSelectedExpiry,
}: {
  boards: LyraBoard[] | null | undefined
  selectedExpiry: LyraBoard | null | undefined
  setSelectedExpiry: Dispatch<any>
}) {
  return (
    <Listbox value={selectedExpiry} onChange={setSelectedExpiry}>
      {({ open }) => (
        <>
          <div className="relative">
            <Listbox.Button className="border-gray-300 relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
              <span className="block truncate">
                {selectedExpiry ? selectedExpiry.name : 'Select an Expiry'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="text-gray-400 h-5 w-5"
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
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {boards?.map((board) => (
                  <Listbox.Option
                    key={board.id}
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={board}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span
                            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                            aria-hidden="true"
                          />
                          <span
                            className={classNames(
                              selected ? 'font-semibold' : 'font-normal',
                              'ml-3 block truncate'
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
  )
}
