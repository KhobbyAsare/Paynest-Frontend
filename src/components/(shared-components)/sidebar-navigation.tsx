'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
    Bars3Icon,
    CalendarIcon,
    ChartPieIcon,
    HomeIcon,
    UsersIcon,
    XMarkIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    ChartBarIcon,
    CogIcon,
    BellIcon,
    DocumentTextIcon,
    KeyIcon,
    ClipboardDocumentCheckIcon,
    QueueListIcon,
    ReceiptPercentIcon,
    WrenchScrewdriverIcon,
    UserCircleIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { Wallet, LogOut, } from 'lucide-react'
import SplitText from './SplitText'
import { useAuthStore } from "@/(zustand-store)/authStore"
import { useRouter, usePathname } from 'next/navigation'
import { LogoutHandler } from '@/(api-handlers)/logoutHandler'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'

interface NavItem {
    name: string;
    href: string;
    icon: any;
    current: boolean;
    roles: ('superadmin' | 'admin' | 'manager' | 'attendant')[];
    subItems?: NavItem[];
}

// Fallback icons for missing imports
const PlusCircleIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ClockIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserPlusIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);

const LifebuoyIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const CheckCircleIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


// Define navigation items based on roles
const navigationItems: NavItem[] = [
    // Dashboard - Accessible to all roles
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: true,
        roles: ['superadmin', 'admin', 'manager', 'attendant']
    },

    // Company Management - SuperAdmin only
    {
        name: 'Organization Management',
        href: '#',
        icon: BuildingOfficeIcon,
        current: false,
        roles: ['superadmin', 'admin'],
        subItems: [
            { name: 'Organizations', href: '/organizations', icon: BuildingOffice2Icon, current: false, roles: ['superadmin', 'admin'] },
            { name: 'Shops', href: '/organizations_shops', icon: BuildingOfficeIcon, current: false, roles: ['admin'] }
        ]
    },

    // User Management - SuperAdmin & Admin only
    {
        name: 'User Management',
        href: '#',
        icon: UsersIcon,
        current: false,
        roles: ['superadmin', 'admin'],
        subItems: [
            { name: 'All Users', href: '/users', icon: UsersIcon, current: false, roles: ['superadmin', 'admin'] },
            { name: 'Add User', href: '/users/create', icon: UserCircleIcon, current: false, roles: ['admin'] },
            { name: 'Roles & Permissions', href: '/users/roles', icon: ShieldCheckIcon, current: false, roles: ['superadmin'] },
        ]
    },

    // Transaction Management - All roles with different access
    {
        name: 'Transactions',
        href: '#',
        icon: CreditCardIcon,
        current: false,
        roles: ['admin', 'manager', 'attendant'],
        subItems: [
            { name: 'All Transactions', href: '/transactions', icon: CreditCardIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
            { name: 'Create Transaction', href: '/transactions/create', icon: PlusCircleIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Pending Transactions', href: '/transactions/pending', icon: ClockIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
            { name: 'Transaction Reports', href: '/transactions/reports', icon: ChartBarIcon, current: false, roles: ['superadmin', 'admin'] },
        ]
    },

    // Financial Management - SuperAdmin & Admin only
    {
        name: 'Financials',
        href: '#',
        icon: CurrencyDollarIcon,
        current: false,
        roles: ['admin'],
        subItems: [
            { name: 'Revenue Reports', href: '/financials/revenue', icon: BanknotesIcon, current: false, roles: ['superadmin', 'admin'] },
            { name: 'Expense Tracking', href: '/financials/expenses', icon: ReceiptPercentIcon, current: false, roles: ['superadmin', 'admin'] },
            { name: 'Profit & Loss', href: '/financials/profit-loss', icon: ChartPieIcon, current: false, roles: ['superadmin', 'admin'] },
        ]
    },
    // Customer Management - All roles
    {
        name: 'Customers',
        href: '#',
        icon: UserGroupIcon,
        current: false,
        roles: ['admin', 'manager', 'attendant'],
        subItems: [
            { name: 'Customer List', href: '/customers', icon: UserGroupIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Add Customer', href: '/customers/create', icon: UserPlusIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
            { name: 'Customer Support', href: '/customers/support', icon: LifebuoyIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
        ]
    },

    // Queue Management - Manager & Attendants
    {
        name: 'Queue',
        href: '/queue',
        icon: QueueListIcon,
        current: false,
        roles: ['manager', 'attendant']
    },

    // Task Management - All roles
    {
        name: 'Tasks',
        href: '#',
        icon: ClipboardDocumentCheckIcon,
        current: false,
        roles: ['admin', 'manager', 'attendant'],
        subItems: [
            { name: 'My Tasks', href: '/tasks/my', icon: ClipboardDocumentCheckIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Team Tasks', href: '/tasks/team', icon: UserGroupIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
            { name: 'Completed Tasks', href: '/tasks/completed', icon: CheckCircleIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
        ]
    },

    // Reports & Analytics - SuperAdmin, Admin, Manager
    {
        name: 'Reports',
        href: '#',
        icon: ChartBarIcon,
        current: false,
        roles: ['admin', 'manager'],
        subItems: [
            { name: 'Performance Reports', href: '/reports/performance', icon: ChartBarIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
            { name: 'Attendance Reports', href: '/reports/attendance', icon: CalendarIcon, current: false, roles: ['superadmin', 'admin'] },
            { name: 'Customer Reports', href: '/reports/customers', icon: UserGroupIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
        ]
    },

    // Settings - All roles with different sections
    {
        name: 'Settings',
        href: '#',
        icon: Cog6ToothIcon,
        current: false,
        roles: ['superadmin', 'admin', 'manager', 'attendant'],
        subItems: [
            { name: 'Profile Settings', href: '/settings/profile', icon: UserCircleIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Account Settings', href: '/settings/account', icon: CogIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
            { name: 'Security', href: '/settings/security', icon: KeyIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Notifications', href: '/settings/notifications', icon: BellIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'System Settings', href: '/settings/system', icon: WrenchScrewdriverIcon, current: false, roles: ['superadmin'] },
        ]
    },

    // Audit Logs - SuperAdmin only
    {
        name: 'Audit Logs',
        href: '/audit-log',
        icon: DocumentTextIcon,
        current: false,
        roles: ['superadmin']
    },
];


function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const { user, clearAuth, accessToken } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    // Get user role from auth store
    const userRole = user?.role as 'superadmin' | 'admin' | 'manager' | 'attendant' || 'attendant'

    // Filter navigation based on user role - Memoized to prevent unnecessary re-renders
    const filteredNavigation = useMemo(() => {
        return navigationItems.filter(item => item.roles.includes(userRole))
    }, [userRole])

    // Helper to check if an item or any sub-item is active
    const isItemActive = (item: NavItem) => {
        if (item.href !== '#' && pathname === item.href) return true
        if (item.subItems) {
            return item.subItems.some(subItem => pathname === subItem.href)
        }
        return false
    }

    // Auto-expand menu if a sub-item is active - Only runs on pathname change
    useEffect(() => {
        const sectionsToExpand: string[] = []
        filteredNavigation.forEach(item => {
            if (item.subItems && item.subItems.some(subItem => pathname === subItem.href)) {
                if (!expandedItems.includes(item.name)) {
                    sectionsToExpand.push(item.name)
                }
            }
        })
        if (sectionsToExpand.length > 0) {
            setExpandedItems(prev => [...new Set([...prev, ...sectionsToExpand])])
        }
        // We only want to auto-expand when the pathname changes (on navigation)
        // This allows users to manually collapse items even if they are active
    }, [pathname])

    const handleLogout = async () => {
        try {
            if (accessToken) {
                await LogoutHandler({ token: accessToken })
            }
            toast.success('Logged out successfully')
        } catch (error: any) {
            console.error('Logout failed:', error)
            // Still clear auth even if backend call fails for better UX
        } finally {
            clearAuth()
            router.push('/login')
        }
    }

    const toggleExpand = (itemName: string) => {
        setExpandedItems(prev =>
            prev.includes(itemName)
                ? prev.filter(name => name !== itemName)
                : [...prev, itemName]
        )
    }

    const renderNavItem = (item: NavItem, isMobile = false) => {
        const hasSubItems = item.subItems && item.subItems.length > 0
        const isExpanded = expandedItems.includes(item.name)
        const isActive = isItemActive(item)

        // Filter subitems based on role
        const filteredSubItems = item.subItems?.filter(subItem =>
            subItem.roles.includes(userRole)
        ) || []

        return (
            <li key={item.name}>
                {hasSubItems ? (
                    <div>
                        <button
                            onClick={() => toggleExpand(item.name)}
                            className={classNames(
                                isActive
                                    ? isMobile ? 'bg-white text-primary' : 'bg-gray-50 text-primary'
                                    : isMobile ? 'text-white hover:bg-gray-50 hover:text-primary' : 'text-white hover:bg-gray-50 hover:text-primary',
                                'group flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                        >
                            <div className="flex items-center gap-x-3">
                                <item.icon
                                    aria-hidden="true"
                                    className={classNames(
                                        isActive
                                            ? isMobile ? 'text-primary' : 'text-primary'
                                            : isMobile ? 'text-white group-hover:text-primary' : 'text-white group-hover:text-primary',
                                        'size-6 shrink-0',
                                    )}
                                />
                                {item.name}
                            </div>
                            <svg
                                className={classNames(
                                    isExpanded ? 'rotate-180' : '',
                                    'size-4 transition-transform duration-200'
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isExpanded && filteredSubItems.length > 0 && (
                            <ul className="mt-1 ml-4 space-y-1 border-l-2 border-white/20 pl-2">
                                {filteredSubItems.map((subItem) => {
                                    const isSubActive = pathname === subItem.href
                                    return (
                                        <li key={subItem.name}>
                                            <Link
                                                href={subItem.href}
                                                className={classNames(
                                                    isSubActive
                                                        ? isMobile ? 'bg-white text-primary' : 'bg-gray-50 text-primary'
                                                        : isMobile ? 'text-white hover:bg-gray-50 hover:text-primary' : 'text-white hover:bg-gray-50 hover:text-primary',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                )}
                                            >
                                                <subItem.icon
                                                    aria-hidden="true"
                                                    className={classNames(
                                                        isSubActive
                                                            ? isMobile ? 'text-primary' : 'text-primary'
                                                            : isMobile ? 'text-white group-hover:text-primary' : 'text-white group-hover:text-primary',
                                                        'size-5 shrink-0',
                                                    )}
                                                />
                                                {subItem.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                ) : (
                    <Link
                        href={item.href}
                        className={classNames(
                            isActive
                                ? isMobile ? 'bg-white text-primary' : 'bg-gray-50 text-primary'
                                : isMobile ? 'text-white hover:bg-gray-50 hover:text-primary' : 'text-white hover:bg-gray-50 hover:text-primary',
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                        )}
                    >
                        <item.icon
                            aria-hidden="true"
                            className={classNames(
                                isActive
                                    ? isMobile ? 'text-primary' : 'text-primary'
                                    : isMobile ? 'text-white group-hover:text-primary' : 'text-white group-hover:text-primary',
                                'size-6 shrink-0',
                            )}
                        />
                        {item.name}
                    </Link>
                )}
            </li>
        )
    }

    const renderRoleBadge = () => {
        const roleColors = {
            superadmin: 'bg-red-500 text-white',
            admin: 'bg-blue-500 text-white',
            manager: 'bg-green-500 text-white',
            attendant: 'bg-purple-500 text-white'
        }

        const roleLabels = {
            superadmin: 'Super Admin',
            admin: 'Administrator',
            manager: 'Manager',
            attendant: 'Attendant'
        }

        return (
            <span className={classNames(
                roleColors[userRole],
                'px-2 py-1 rounded-full text-xs font-semibold'
            )}>
                {roleLabels[userRole]}
            </span>
        )
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
                                <div >
                                    {renderRoleBadge()}
                                </div>
                                <nav className="relative flex flex-1 flex-col">
                                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                        <li>
                                            <ul role="list" className="-mx-2 space-y-1">
                                                {filteredNavigation.map((item) => renderNavItem(item, true))}
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
                                                    <div className="flex flex-col">
                                                        <span className="sr-only">Your profile</span>
                                                        <span aria-hidden="true">{user?.first_name} {user?.last_name}</span>
                                                        <span className="text-xs text-gray-300">{user?.email}</span>
                                                    </div>
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
                        <div>
                            {renderRoleBadge()}
                        </div>
                        <nav className="relative flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {filteredNavigation.map((item) => renderNavItem(item))}
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
                                            <div className="flex flex-col">
                                                <span className="sr-only">Your profile</span>
                                                <span aria-hidden="true">{user?.first_name} {user?.last_name}</span>
                                                <span className="text-xs text-gray-300">{user?.email}</span>
                                            </div>
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
                    <div className="relative flex-1 text-sm/6 font-semibold text-gray-900">
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
                    </div>
                    <div className="flex items-center gap-x-3">
                        {renderRoleBadge()}
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
                </div>

                <main className="lg:pl-72">
                    <div >
                        <div className="sticky top-0 z-50 bg-primary text-white p-4">
                            <h1 className="text-2xl font-bold text-gray-100">
                                Welcome back, {user?.first_name}!
                            </h1>
                            <p className="text-gray-300">
                                {userRole === 'superadmin' && 'Manage the entire system and oversee all operations.'}
                                {userRole === 'admin' && 'Manage users, transactions, and financial reports.'}
                                {userRole === 'manager' && 'Oversee daily operations and team performance.'}
                                {userRole === 'attendant' && 'Handle customer transactions and queue management.'}
                            </p>
                        </div>
                        <div className="p-4 lg:p-4 lg:pt-0 min-h-[80vh]">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}