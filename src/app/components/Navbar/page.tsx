import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/solid'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
const navigation = [
  { name: 'Dashboard', href: '/Dashboard', current: true },
  { name: 'History', href: '/Papers', current: false }
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  return (
   <Disclosure as="nav" className="bg-green-700">
  <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
    <div className="relative flex h-16 items-center justify-between">
      <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
        {/* Mobile menu button*/}
        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-green-100 hover:bg-green-600 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
          <span className="absolute -inset-0.5" />
          <span className="sr-only">Open main menu</span>
          <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
          <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
        </DisclosureButton>
      </div>
      <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
        <div className="flex shrink-0 items-center text-2xl font-extrabold tracking-wide text-white uppercase">
          exam<span className="text-green-200">AI</span>
        </div>

        <div className="hidden sm:ml-6 sm:block">
          <div className="flex space-x-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-600 hover:text-white',
                  'rounded-md px-3 py-2 text-sm font-medium',
                )}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-8 sm:pr-0">

        {/* Profile dropdown */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-white text-green-700 border border-green-700 rounded font-medium text-sm sm:text-base h-9 px-4 sm:px-5 hover:bg-green-50 transition-all duration-200">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  </div>

  <DisclosurePanel className="sm:hidden">
    <div className="space-y-1 px-2 pt-2 pb-3">
      {navigation.map((item) => (
        <DisclosureButton
          key={item.name}
          as="a"
          href={item.href}
          aria-current={item.current ? 'page' : undefined}
          className={classNames(
            item.current ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-600 hover:text-white',
            'block rounded-md px-3 py-2 text-base font-medium',
          )}
        >
          {item.name}
        </DisclosureButton>
      ))}
    </div>
  </DisclosurePanel>
</Disclosure>

  )
}
