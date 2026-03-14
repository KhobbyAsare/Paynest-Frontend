'use client'

import { useState, useEffect, useMemo, JSX } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
    Bars3Icon,
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
    ReceiptPercentIcon,
    WrenchScrewdriverIcon,
    Square2StackIcon,
    UserCircleIcon,
    CubeTransparentIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    CalculatorIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ShoppingCartIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { Wallet, LogOut } from 'lucide-react'
import SplitText from './SplitText'
import { useAuthStore } from "@/(zustand-store)/authStore"
import { useRouter, usePathname } from 'next/navigation'
import { LogoutHandler } from '@/(api-handlers)/logoutHandler'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    current: boolean;
    roles: ('superadmin' | 'admin' | 'manager' | 'attendant')[];
    subItems?: NavItem[];
}

// Fallback icons for missing imports
const PlusCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);

// Define navigation items based on roles
const navigationItems: NavItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: true,
        roles: ['superadmin', 'admin', 'manager', 'attendant']
    },
    {
        name: 'Sales',
        href: '#',
        icon: CalculatorIcon,
        current: false,
        roles: ['admin', 'manager', 'attendant'],
        subItems: [
            { name: 'POS', href: '/sales', icon: CalculatorIcon, current: false, roles: ['attendant'] },
            { name: 'Orders & Walk-ins', href: '/orders', icon: ReceiptPercentIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Daily Sales Analysis', href: '/sales-report', icon: ChartBarIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Order Items', href: '/order-items', icon: ShoppingCartIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Payments', href: '/payments', icon: BanknotesIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
        ]
    },
    {
        name: 'Organization Management',
        href: '#',
        icon: BuildingOfficeIcon,
        current: false,
        roles: ['superadmin', 'admin'],
        subItems: [
            { name: 'Organizations', href: '/organizations', icon: BuildingOffice2Icon, current: false, roles: ['superadmin'] },
            { name: 'Shops', href: '/organization_shops', icon: BuildingOfficeIcon, current: false, roles: ['admin'] }
        ]
    },
    {
        name: 'Products',
        href: '/products',
        icon: Square2StackIcon,
        current: false,
        roles: ['attendant'],
    },
    {
        name: 'Product Categories',
        href: '/product_categories',
        icon: CubeTransparentIcon,
        current: false,
        roles: ['attendant'],
    },
    {
        name: 'Daily Closure',
        href: '/daily-closure',
        icon: BanknotesIcon,
        current: false,
        roles: ['admin', 'manager', 'attendant']
    },
    {
        name: 'User Management',
        href: '#',
        icon: UsersIcon,
        current: false,
        roles: ['superadmin', 'admin'],
        subItems: [
            { name: 'All Users', href: '/users', icon: UsersIcon, current: false, roles: ['superadmin', 'admin'] },
            { name: 'Setup Employee Profile', href: '/users/setup-employee-profile', icon: UserCircleIcon, current: false, roles: ['admin'] },
            { name: 'Roles & Permissions', href: '/users/roles', icon: ShieldCheckIcon, current: false, roles: ['superadmin'] },
        ]
    },
    {
        name: 'Inventory',
        href: '#',
        icon: CreditCardIcon,
        current: false,
        roles: ['manager', 'attendant'],
        subItems: [
            { name: 'All Inventory', href: '/inventory', icon: CreditCardIcon, current: false, roles: ['manager', 'attendant'] },
            { name: 'Create Inventory', href: '/inventory/create', icon: PlusCircleIcon, current: false, roles: ['manager', 'attendant'] }
        ]
    },
    {
        name: 'Reports',
        href: '#',
        icon: ChartBarIcon,
        current: false,
        roles: ['admin', 'manager'],
        subItems: [
            { name: 'Organization Reports', href: '/report', icon: ChartBarIcon, current: false, roles: ['admin'] },
            { name: 'My Reports', href: '/report/my_report', icon: ChartBarIcon, current: false, roles: ['admin', 'manager'] },
            { name: 'Pending Reports', href: '/report/pending', icon: ChartBarIcon, current: false, roles: ['admin'] },
        ]
    },
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
    {
        name: 'Customers',
        href: '#',
        icon: UserGroupIcon,
        current: false,
        roles: ['admin', 'manager', 'attendant'],
        subItems: [
            { name: 'Customer List', href: '/customers', icon: UserGroupIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Add Customer', href: '/customers/create', icon: UserPlusIcon, current: false, roles: ['superadmin', 'admin', 'manager'] },
        ]
    },
    {
        name: 'Settings',
        href: '#',
        icon: Cog6ToothIcon,
        current: false,
        roles: ['superadmin', 'admin', 'manager', 'attendant'],
        subItems: [
            { name: 'Profile Settings', href: '/settings/profile', icon: UserCircleIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Organization Profile', href: '/organization_profile', icon: CogIcon, current: false, roles: ['admin'] },
            { name: 'Security', href: '/settings/security', icon: KeyIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'Notifications', href: '/settings/notifications', icon: BellIcon, current: false, roles: ['superadmin', 'admin', 'manager', 'attendant'] },
            { name: 'System Settings', href: '/settings/system', icon: WrenchScrewdriverIcon, current: false, roles: ['superadmin'] },
        ]
    },

    {
        name: 'Audit Logs',
        href: '/audit-log',
        icon: DocumentTextIcon,
        current: false,
        roles: ['superadmin']
    },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const roleColors = {
    superadmin: 'bg-red-500 text-white',
    admin: 'bg-blue-500 text-white',
    manager: 'bg-green-500 text-white',
    attendant: 'bg-purple-500 text-white'
};

const roleLabels = {
    superadmin: 'Super Admin',
    admin: 'Administrator',
    manager: 'Manager',
    attendant: 'Attendant'
};

export default function Sidebar({ children }: Readonly<{ children: React.ReactNode }>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const { user, clearAuth, accessToken } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const userRole = (user?.role as 'superadmin' | 'admin' | 'manager' | 'attendant') || 'attendant';

    const filteredNavigation = useMemo(() => {
        return navigationItems.filter(item => item.roles.includes(userRole));
    }, [userRole]);

    const isItemActive = (item: NavItem) => {
        if (item.href !== '#' && pathname === item.href) return true;
        if (item.subItems) {
            return item.subItems.some(subItem => pathname === subItem.href);
        }
        return false;
    };

    useEffect(() => {
        const sectionsToExpand: string[] = [];
        filteredNavigation.forEach(item => {
            if (item.subItems?.some(subItem => pathname === subItem.href)) {
                if (!expandedItems.includes(item.name)) {
                    sectionsToExpand.push(item.name);
                }
            }
        });
        if (sectionsToExpand.length > 0) {
            setExpandedItems(prev => [...new Set([...prev, ...sectionsToExpand])]);
        }
    }, [pathname, expandedItems, filteredNavigation]);

    const handleLogout = async () => {
        try {
            if (accessToken) {
                await LogoutHandler({ token: accessToken });
            }
            toast.success('Logged out successfully');
        } catch (error: unknown) {
            console.error('Logout failed:', error);
        } finally {
            clearAuth();
            router.push('/login');
        }
    };

    const toggleExpand = (itemName: string) => {
        setExpandedItems(prev =>
            prev.includes(itemName)
                ? prev.filter(name => name !== itemName)
                : [...prev, itemName]
        );
    };

    const renderRoleBadge = (): JSX.Element => {
        return (
            <span className={classNames(
                roleColors[userRole],
                'px-2 py-1 rounded-full text-xs font-semibold'
            )}>
                {roleLabels[userRole]}
            </span>
        );
    };

    const renderNavItem = (item: NavItem, isMobile = false) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.includes(item.name);
        const isActive = isItemActive(item);
        const filteredSubItems = item.subItems?.filter(subItem =>
            subItem.roles.includes(userRole)
        ) || [];
        const Icon = item.icon;

        return (
            <li key={item.name}>
                {hasSubItems ? (
                    <div>
                        <button
                            onClick={() => isCollapsed && !isMobile ? setIsCollapsed(false) : toggleExpand(item.name)}
                            className={classNames(
                                isActive
                                    ? isMobile ? 'bg-white text-primary' : 'bg-gray-50 text-primary'
                                    : isMobile ? 'text-white hover:bg-gray-50 hover:text-primary' : 'text-white hover:bg-gray-50 hover:text-primary',
                                'group flex w-full items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-all duration-300',
                                isCollapsed && !isMobile ? 'justify-center' : 'justify-between'
                            )}
                        >
                            <div className="flex items-center gap-x-3">
                                <Icon
                                    aria-hidden="true"
                                    className={classNames(
                                        isActive
                                            ? isMobile ? 'text-primary' : 'text-primary'
                                            : isMobile ? 'text-white group-hover:text-primary' : 'text-white group-hover:text-primary',
                                        'size-6 shrink-0',
                                    )}
                                />
                                {(!isCollapsed || isMobile) && <span>{item.name}</span>}
                            </div>
                            {(!isCollapsed || isMobile) && (
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
                            )}
                        </button>
                        {isExpanded && filteredSubItems.length > 0 && (!isCollapsed || isMobile) && (
                            <ul className="mt-1 ml-4 space-y-1 border-l-2 border-white/20 pl-2">
                                {filteredSubItems.map((subItem) => {
                                    const isSubActive = pathname === subItem.href;
                                    const SubIcon = subItem.icon;
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
                                                <SubIcon
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
                                    );
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
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-all duration-300',
                            isCollapsed && !isMobile ? 'justify-center' : ''
                        )}
                    >
                        <Icon
                            aria-hidden="true"
                            className={classNames(
                                isActive
                                    ? isMobile ? 'text-primary' : 'text-primary'
                                    : isMobile ? 'text-white group-hover:text-primary' : 'text-white group-hover:text-primary',
                                'size-6 shrink-0',
                            )}
                        />
                        {(!isCollapsed || isMobile) && <span>{item.name}</span>}
                    </Link>
                )}
            </li>
        );
    };

    return (
        <div style={{ opacity: isMounted ? 1 : 0, transition: 'opacity 0.15s ease' }}>
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
                        <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                            <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                <span className="sr-only">Close sidebar</span>
                                <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                            </button>
                        </div>
                        <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-primary px-6 pb-2">
                            <div className="sticky top-0 z-20 bg-primary pt-5 pb-1 -mx-6 px-6">
                                <div className="relative flex h-16 shrink-0 items-center gap-2">
                                    <Wallet className='size-8 text-white' />
                                    <SplitText text="Paynest" className="text-2xl font-bold text-white" />
                                </div>
                                <div className="mt-4">
                                    {renderRoleBadge()}
                                </div>
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
            <div className={classNames(
                "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out border-r border-gray-200 bg-primary",
                isCollapsed ? "lg:w-20" : "lg:w-72"
            )}>
                <div className="relative flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-2">
                    <div className="sticky top-0 z-20 bg-primary pt-5 pb-1 -mx-6 px-6">
                        <div className={classNames(
                            "relative flex h-16 shrink-0 items-center justify-between",
                            isCollapsed ? "flex-col gap-y-4" : "gap-x-2"
                        )}>
                            <div className="flex items-center gap-x-2">
                                <Wallet className='size-8 text-white shrink-0' />
                                {!isCollapsed && <SplitText text="Paynest" className="text-2xl font-bold text-white whitespace-nowrap" />}
                            </div>
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                            >
                                {isCollapsed ? (
                                    <ChevronDoubleRightIcon className="size-5" />
                                ) : (
                                    <ChevronDoubleLeftIcon className="size-5" />
                                )}
                            </button>
                        </div>
                        {!isCollapsed && (
                            <div className="mt-4">
                                {renderRoleBadge()}
                            </div>
                        )}
                    </div>
                    <nav className="relative flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {filteredNavigation.map((item) => renderNavItem(item))}
                                </ul>
                            </li>
                            <li className="-mx-6 mt-auto">
                                <div className="flex flex-col border-t border-white/10 pt-4">
                                    <div className={classNames(
                                        "flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white",
                                        isCollapsed ? "justify-center" : ""
                                    )}>
                                        <Image
                                            alt="Profile"
                                            src={user?.profile_pic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                                            width={32}
                                            height={32}
                                            className="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5 shrink-0"
                                        />
                                        {!isCollapsed && (
                                            <div className="flex flex-col truncate">
                                                <span className="sr-only">Your profile</span>
                                                <span className="truncate">{user?.first_name} {user?.last_name}</span>
                                                <span className="text-[10px] text-gray-300 truncate">{user?.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className={classNames(
                                            "flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-red-500/10 hover:text-red-400 transition-colors",
                                            isCollapsed ? "justify-center px-2" : ""
                                        )}
                                    >
                                        <LogOut className="size-5 shrink-0" />
                                        {!isCollapsed && <span>Logout</span>}
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

            <main className={classNames(
                "transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:pl-20" : "lg:pl-72"
            )}>
                <div>
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
                    <div className="p-4 lg:p-4 lg:pt-0 min-h-[80vh] container mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
