import React, { Dispatch, Fragment } from 'react'
import { Listbox, Transition } from "@headlessui/react"
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { StrategyDirection, StrategyType } from '../../../../utils/builder/types'

const DirectionType: StrategyDirection[] = [
  {
    id: StrategyType.Bearish,
    name: '🐻Bearish'
  },
  {
    id: StrategyType.Bullish,
    name: '🐂Bullish'
  },
  {
    id: StrategyType.Volatile,
    name: '🌊Volatile'
  },
  {
    id: StrategyType.Calm,
    name: '⛵Calm'
  },
  {
    id: StrategyType.Neutral,
    name: '✌Neutral'
  }
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const buildTextSelectedDirections = (directionTypes: StrategyDirection[]) => {
  return directionTypes.map(({ name }: { name: string }) => name).join(' ');
}

export const SelectDirectionType = (
  {
    selectedDirectionTypes,
    setSelectedDirectionTypes
  }:
    {
      selectedDirectionTypes: StrategyDirection[]
      setSelectedDirectionTypes: Dispatch<StrategyDirection[]>
    }
) => {

  // const { selectedDirectionTypes, handleSelectedDirectionTypes } = useBuilderContext()

  const isSelected = (data: any) => {
    return selectedDirectionTypes.find((_direction: StrategyDirection) => (_direction.id == data.id));
  }

  return <Listbox value={selectedDirectionTypes} onChange={(data: any) => {
    if (isSelected(data)) {
      // filter out 
      const _directionTypesFiltered = selectedDirectionTypes.filter((_direction: StrategyDirection) => (_direction.id != data.id));
      setSelectedDirectionTypes(_directionTypesFiltered)
    } else {
      setSelectedDirectionTypes(selectedDirectionTypes.concat([data]))
    }

  }}>
    {({ open }) => (
      <>
        <div className="relative sm:pl-2">
          <Listbox.Button className="rounded-xs relative w-full h-full  cursor-default border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-10 text-left text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="block truncate">
              {selectedDirectionTypes.length > 0 ? buildTextSelectedDirections(selectedDirectionTypes) : 'Market Expectation'}
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
              {DirectionType.map((direction: StrategyDirection) => (
                <Listbox.Option
                  key={direction.id}
                  className={({ active }) =>
                    classNames(
                      active ? 'bg-emerald-600 text-white' : 'text-white',
                      'relative cursor-default select-none py-2 pl-3 pr-9'
                    )
                  }
                  value={direction}
                >
                  {({ active }) => {
                    const selected = isSelected(direction);
                    return <>
                      <div className="flex items-center">

                        <span
                          className={classNames(
                            selected ? 'font-semibold' : 'font-normal',
                            'block truncate'
                          )}
                        >
                          {direction.name}
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
                  }}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </>
    )}
  </Listbox>
}