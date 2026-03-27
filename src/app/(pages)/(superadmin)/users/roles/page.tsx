"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import PageHeader from '@/components/(shared-components)/PageHeader';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface RolePermission {
    permission: string;
    superadmin: boolean;
    admin: boolean;
    manager: boolean;
    attendant: boolean;
}

const rolePermissions: RolePermission[] = [
    // Dashboard & Analytics
    { permission: 'View Admin Dashboard', superadmin: true, admin: true, manager: false, attendant: false },
    { permission: 'View Finance Analytics', superadmin: true, admin: true, manager: false, attendant: false },
    { permission: 'View Sales Report', superadmin: true, admin: true, manager: true, attendant: true },

    // Organizations
    { permission: 'Manage All Organizations', superadmin: true, admin: false, manager: false, attendant: false },
    { permission: 'Create / Delete Organizations', superadmin: true, admin: false, manager: false, attendant: false },
    { permission: 'Change Organization Plan', superadmin: true, admin: false, manager: false, attendant: false },

    // Users
    { permission: 'View All Users (System-wide)', superadmin: true, admin: false, manager: false, attendant: false },
    { permission: 'View Organization Users', superadmin: true, admin: true, manager: false, attendant: false },
    { permission: 'Manage Roles & Permissions', superadmin: true, admin: false, manager: false, attendant: false },
    { permission: 'Setup Employee Profiles', superadmin: false, admin: true, manager: false, attendant: false },

    // Products & Inventory
    { permission: 'Manage Products', superadmin: true, admin: true, manager: true, attendant: true },
    { permission: 'Manage Inventory', superadmin: true, admin: true, manager: true, attendant: true },
    { permission: 'View Stock Movements', superadmin: true, admin: true, manager: true, attendant: true },

    // Sales & Orders
    { permission: 'Create POS Sales', superadmin: false, admin: false, manager: false, attendant: true },
    { permission: 'View Orders', superadmin: true, admin: true, manager: true, attendant: true },
    { permission: 'Manage Daily Closure', superadmin: false, admin: true, manager: true, attendant: true },

    // Customers
    { permission: 'Manage Customers', superadmin: true, admin: true, manager: true, attendant: true },

    // Reports
    { permission: 'View All Org Reports', superadmin: false, admin: true, manager: false, attendant: false },
    { permission: 'Generate Reports', superadmin: false, admin: true, manager: true, attendant: false },
    { permission: 'Approve / Reject Reports', superadmin: false, admin: true, manager: false, attendant: false },

    // Audit & System
    { permission: 'View Audit Logs', superadmin: true, admin: false, manager: false, attendant: false },
    { permission: 'System Settings', superadmin: true, admin: false, manager: false, attendant: false },
];

const roles = [
    { key: 'superadmin', label: 'Super Admin', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
    { key: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { key: 'manager', label: 'Manager', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    { key: 'attendant', label: 'Attendant', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
];

const roleDescriptions: Record<string, { desc: string; access: string }> = {
    superadmin: {
        desc: 'Full platform access. Manages all organizations, system settings, and global configurations.',
        access: 'Unlimited',
    },
    admin: {
        desc: 'Organization-level administrator. Manages users, reports, financials, and daily operations within their org.',
        access: 'Organization-wide',
    },
    manager: {
        desc: 'Manages daily store operations, inventory, closures, and reviews reports for their assigned shop.',
        access: 'Shop-level',
    },
    attendant: {
        desc: 'Front-line staff. Handles POS sales, walk-in orders, and inventory tasks at the counter.',
        access: 'Transaction-level',
    },
};

export default function RolesPermissionsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'superadmin') {
            router.replace('/dashboard');
        }
    }, [user, router]);

    if (!user || user.role !== 'superadmin') {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <RefreshCcw className="size-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Roles & Permissions"
                description="Overview of access levels across all roles in the Paynest system."
            />

            <div className="mt-8 space-y-6">
                {/* Role overview cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roles.map((role) => {
                        const info = roleDescriptions[role.key];
                        return (
                            <Card key={role.key} className="p-5 rounded-2xl border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`size-2.5 rounded-full ${role.dot}`} />
                                    <Badge className={`text-xs font-semibold border-none ${role.color}`}>
                                        {role.label}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-3">{info.desc}</p>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="size-3.5 text-slate-400" />
                                    <span className="text-xs text-slate-400">{info.access}</span>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Permissions matrix */}
                <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden p-0">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="font-semibold text-slate-900 text-sm">Permission Matrix</p>
                        <p className="text-xs text-slate-400 mt-0.5">A comprehensive view of what each role can and cannot do.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/2">Permission</th>
                                    {roles.map((role) => (
                                        <th key={role.key} className="text-center px-4 py-3 min-w-[100px]">
                                            <Badge className={`text-xs font-semibold border-none ${role.color}`}>
                                                {role.label}
                                            </Badge>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rolePermissions.map((row) => (
                                    <tr key={row.permission} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 text-slate-700 text-sm font-medium">{row.permission}</td>
                                        {(['superadmin', 'admin', 'manager', 'attendant'] as const).map((role) => (
                                            <td key={role} className="px-4 py-3 text-center">
                                                {row[role] ? (
                                                    <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="size-4 text-slate-200 mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-400">
                        {rolePermissions.length} permissions defined · Role changes require a re-login to take effect.
                    </div>
                </Card>
            </div>
        </div>
    );
}
