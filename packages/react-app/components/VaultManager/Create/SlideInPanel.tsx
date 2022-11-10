/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '../../UI/Components/Button'

export default function SlideInPanel({
  step,
  setStep,
  isCreating,
  handleCreateVault,
  setOpen,
  open,
  title,
  children,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <div className="flex h-full flex-col divide-y divide-zinc-700 border-l border-zinc-800 bg-gradient-to-b from-black to-zinc-900 shadow-xl">
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-scroll py-6">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-end justify-between">
                          <Dialog.Title className="text-lg font-medium text-zinc-400"></Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onClick={() => setOpen(false)}
                            >
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        {/* Replace with your content */}
                        <div className="h-full" aria-hidden="true">
                          {/* /End replace */}
                          {children}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 space-x-4 justify-end px-4 py-4">

                      {
                        step == 1 ?
                          <>
                            <Button
                              label={'Next'}
                              isLoading={false}
                              variant={'action'}
                              radius={'xs'}
                              size={'md'}
                              onClick={() => setStep(2)}
                            />
                          </> :
                          <>
                            <Button
                              label={'Previous'}
                              isLoading={false}
                              variant={'action'}
                              radius={'xs'}
                              size={'md'}
                              onClick={() => setStep(1)}
                            />
                            <Button
                              label={'Create'}
                              isLoading={false}
                              variant={'action'}
                              radius={'xs'}
                              size={'md'}
                              onClick={handleCreateVault}
                            />
                          </>
                      }

                    </div>

                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
