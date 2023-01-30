import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import OneIcon from '../Components/Icons/Header/ONE'
import OpIcon from '../Components/Icons/Header/OP'
import { useWeb3Context } from '../../../context'
import { SupportedChainsList } from '../../../constants/supportedChains'

type NetworkOption = {
  title: string
  chainId: number
  current: boolean
}

const getChainOptions = (): NetworkOption[] => {
  return SupportedChainsList.map((supported, index) => {
    const { name, chainId } = supported;
    return { title: name, chainId: chainId, current: false } as NetworkOption
  })
}

const chainOptions = getChainOptions();

const getIcon = (type: string) => {
  switch (type) {
    case 'Optimism':
      return <OpIcon className="h-6 w-6" aria-hidden="true" />
    case 'Arbitrum':
      return <OneIcon className="h-6 w-6" aria-hidden="true" />
    default:
      break;
  }
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Web3Network() {
  const { network, setNetwork } = useWeb3Context();

  const [selected, setSelected] = useState<NetworkOption>({ ...chainOptions[0], current: true });

  const _setNetwork = useCallback(() => {
    if (network) {
      console.log({ network })
      const chainOption = chainOptions.find(chain => chain.chainId === network?.chainId);
      console.log({ chainOption })

      if (chainOption) {
        setSelected({ ...chainOption, current: true })
      }
    }
  }, [network])

  useEffect(() => {
    if (network) {
      _setNetwork();
    }
  }, [network])

  console.log({ selected })

  return (
    <Listbox value={selected} onChange={async (networkOption) => {
      // setSelected(v);
      await setNetwork(networkOption);
      // setSelected(networkOption);
    }}>
      {({ open }) => (
        <>
          <Listbox.Label className="sr-only"> Change published status </Listbox.Label>
          <div className="relative">
            <div className="inline-flex divide-x divide-zinc-900 rounded-md shadow-sm">
              <div className="inline-flex divide-x divide-zinc-900 rounded-md shadow-sm">

                <div className="inline-flex items-center rounded-l-md  bg-zinc-800 py-2 pl-3 pr-4 text-white shadow-sm">
                  {getIcon(selected.title)}
                  <p className="ml-2.5 text-sm font-medium">{selected.title}</p>
                </div>
                <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md bg-zinc-800 p-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50">
                  <span className="sr-only">Change published status</span>
                  <ChevronDownIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </Listbox.Button>
              </div>
            </div>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute right-0 z-10 mt-2 w-full origin-top-right divide-y divide-zinc-900 overflow-hidden rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {chainOptions.map((option) => (
                  <Listbox.Option
                    key={option.title}
                    className={({ active }) =>
                      classNames(
                        active ? 'text-white bg-indigo-500' : 'text-zinc-200',
                        'cursor-default select-none p-4 text-sm'
                      )
                    }
                    value={option}
                  >
                    {({ active }) => {
                      return (
                        <div className="flex flex-col">
                          <div className="flex">
                            {getIcon(option.title)}

                            <p className={selected.chainId === option.chainId ? 'ml-2.5 text-sm font-semibold' : 'ml-2.5 text-sm font-normal'}>{option.title}</p>
                            {selected.chainId === option.chainId ? (
                              <span className={active ? 'text-white' : 'text-indigo-500'}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    }}
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
