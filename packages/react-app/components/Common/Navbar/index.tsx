import React from 'react'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Web3Button } from '../Web3'
import { useRouter } from 'next/router'

const linkStyle = (path: string, activePath: string) => {
  if (path == activePath) {
    return 'rounded-md bg-dark-gray px-3 py-2 text-sm font-medium text-black'
  } else {
    return 'rounded-md px-3 py-2 text-sm font-medium text-gray hover:bg-gray hover:text-black'
  }
}

const linkStyleMobile = (path: string, activePath: string) => {
  if (path == activePath) {
    return 'block rounded-md bg-dark-gray px-3 py-2 text-base font-medium text-black'
  } else {
    return 'block rounded-md px-3 py-2 text-base font-medium text-gray hover:bg-gray hover:text-black'
  }
}

export const Navbar = () => {
  const router = useRouter()
  return (
    <Disclosure as="nav" className="bg-black">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="block w-auto cursor-pointer font-sans text-xl font-bold text-white lg:hidden">
                    Otus Finance
                  </span>
                  <span className="hidden w-auto cursor-pointer font-sans text-2xl font-bold text-white lg:block">
                    Otus Finance
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    <Link href="/">
                      <a className={linkStyle('/', router.pathname)}>
                        Products
                      </a>
                    </Link>
                    <Link href="/portfolio">
                      <a className={linkStyle('/portfolio', router.pathname)}>
                        Portfolio
                      </a>
                    </Link>
                    <Link href="/my-vaults">
                      <a className={linkStyle('/my-vaults', router.pathname)}>
                        My Vaults
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex items-center">
                  {/* Profile dropdown */}
                  <Web3Button />
                </div>
              </div>
              <div className="-mr-2 flex sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray hover:bg-gray hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              <Link href="/">
                <Disclosure.Button
                  className={linkStyleMobile('/', router.pathname)}
                >
                  Products
                </Disclosure.Button>
              </Link>
              <Link href="/portfolio">
                <Disclosure.Button
                  className={linkStyleMobile('/portfolio', router.pathname)}
                >
                  Portfolio
                </Disclosure.Button>
              </Link>
              <Link href="/my-vaults">
                <Disclosure.Button
                  className={linkStyleMobile('/my-vaults', router.pathname)}
                >
                  My Vaults
                </Disclosure.Button>
              </Link>
            </div>
            <div className="border-t border-gray pt-4 pb-3">
              <div className="flex items-center px-5">
                <Web3Button />
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
