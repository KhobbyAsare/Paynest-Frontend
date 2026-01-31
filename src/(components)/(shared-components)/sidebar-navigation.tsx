'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
    Bars3Icon,
    CalendarIcon,
    ChartPieIcon,
    DocumentDuplicateIcon,
    FolderIcon,
    HomeIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { Wallet, LogOut } from 'lucide-react'
import SplitText from './SplitText'
import { useAuthStore } from "@/(zustand-store)/authStore"
import { useRouter } from 'next/navigation'

const navigation = [
    { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
    { name: 'Team', href: '#', icon: UsersIcon, current: false },
    { name: 'Projects', href: '#', icon: FolderIcon, current: false },
    { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
    { name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
    { name: 'Reports', href: '#', icon: ChartPieIcon, current: false },
]
const teams = [
    { id: 1, name: 'Heroicons', href: '#', initial: 'H', current: false },
    { id: 2, name: 'Tailwind Labs', href: '#', initial: 'T', current: false },
    { id: 3, name: 'Workcation', href: '#', initial: 'W', current: false },
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, clearAuth } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        clearAuth()
        router.push('/login')
    }

    return (
        <>
            <div>
                <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
                    />
                    <div className="fixed inset-0 flex">
                        <DialogPanel
                            transition
                            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                        >
                            <TransitionChild>
                                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                                    <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                        <span className="sr-only">Close sidebar</span>
                                        <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                                    </button>
                                </div>
                            </TransitionChild>
                            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-primary px-6 pb-2">
                                <div className="relative flex h-16 shrink-0 items-center gap-2">
                                    <Wallet className='size-8 text-white' />
                                    <SplitText text="Paynest" className="text-2xl font-bold text-white" />
                                </div>
                                <nav className="relative flex flex-1 flex-col">
                                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                        <li>
                                            <ul role="list" className="-mx-2 space-y-1">
                                                {navigation.map((item) => (
                                                    <li key={item.name}>
                                                        <a
                                                            href={item.href}
                                                            className={classNames(
                                                                item.current
                                                                    ? 'bg-white text-primary'
                                                                    : 'text-white hover:bg-gray-50 hover:text-primary',
                                                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                            )}
                                                        >
                                                            <item.icon
                                                                aria-hidden="true"
                                                                className={classNames(
                                                                    item.current ? 'text-primary' : 'text-white group-hover:text-primary',
                                                                    'size-6 shrink-0',
                                                                )}
                                                            />
                                                            {item.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                        <li>
                                            <div className="text-xs/6 font-semibold text-gray-400">Your teams</div>
                                            <ul role="list" className="-mx-2 mt-2 space-y-1">
                                                {teams.map((team) => (
                                                    <li key={team.name}>
                                                        <a
                                                            href={team.href}
                                                            className={classNames(
                                                                team.current
                                                                    ? 'bg-gray-50 text-primary'
                                                                    : 'text-white hover:bg-gray-50 hover:text-primary',
                                                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                            )}
                                                        >
                                                            <span
                                                                className={classNames(
                                                                    team.current
                                                                        ? 'border-primary text-primary'
                                                                        : 'border-gray-200 text-primary group-hover:border-primary group-hover:text-primary',
                                                                    'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                                                                )}
                                                            >
                                                                {team.initial}
                                                            </span>
                                                            <span className="truncate">{team.name}</span>
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                        <li className="-mx-6 mt-auto">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white">
                                                    <Image
                                                        alt="Profile"
                                                        src={user?.profile_pic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                                                        width={32}
                                                        height={32}
                                                        className="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5"
                                                    />
                                                    <span className="sr-only">Your profile</span>
                                                    <span aria-hidden="true">{user?.first_name} {user?.last_name}</span>
                                                </div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                >
                                                    <LogOut className="size-5" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>

                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                    <div className="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-primary px-6 pb-2">
                        <div className="relative flex h-16 shrink-0 items-center gap-2">
                            <Wallet className='size-8 text-white' />
                            <SplitText text="Paynest" className="text-2xl font-bold text-white" />
                        </div>
                        <nav className="relative flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className={classNames(
                                                        item.current
                                                            ? 'bg-gray-50 text-primary'
                                                            : 'text-white hover:bg-gray-50 hover:text-primary',
                                                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                    )}
                                                >
                                                    <item.icon
                                                        aria-hidden="true"
                                                        className={classNames(
                                                            item.current ? 'text-primary' : 'text-white group-hover:text-primary',
                                                            'size-6 shrink-0',
                                                        )}
                                                    />
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                <li>
                                    <div className="text-xs/6 font-semibold text-gray-400">Your teams</div>
                                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                                        {teams.map((team) => (
                                            <li key={team.name}>
                                                <a
                                                    href={team.href}
                                                    className={classNames(
                                                        team.current
                                                            ? 'bg-gray-50 text-primary'
                                                            : 'text-white hover:bg-gray-50 hover:text-primary',
                                                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                    )}
                                                >
                                                    <span
                                                        className={classNames(
                                                            team.current
                                                                ? 'border-primary text-primary'
                                                                : 'border-gray-200 text-primary group-hover:border-primary group-hover:text-primary',
                                                            'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                                                        )}
                                                    >
                                                        {team.initial}
                                                    </span>
                                                    <span className="truncate">{team.name}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                <li className="-mx-6 mt-auto">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white">
                                            <Image
                                                alt="Profile"
                                                src={user?.profile_pic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                                                width={32}
                                                height={32}
                                                className="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5"
                                            />
                                            <span className="sr-only">Your profile</span>
                                            <span aria-hidden="true">{user?.first_name} {user?.last_name}</span>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                        >
                                            <LogOut className="size-5" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="relative -m-2.5 p-2.5 text-gray-700 lg:hidden"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                    <div className="relative flex-1 text-sm/6 font-semibold text-gray-900">Dashboard</div>
                    <div className="relative">
                        <span className="sr-only">Your profile</span>
                        <Image
                            alt="Profile"
                            src={user?.profile_pic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                            width={32}
                            height={32}
                            className="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5"
                        />
                    </div>
                </div>

                <main className="lg:pl-72">
                    {children}
                </main>
            </div>
        </>
    )
}
