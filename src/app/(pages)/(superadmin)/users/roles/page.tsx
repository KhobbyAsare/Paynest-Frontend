"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import PageHeader from '@/components/(shared-components)/PageHeader';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

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
    { key: 'superadmin', label: 'Super Admin', color: 'border-destructive/30 bg-destructive/10 text-destructive', dot: 'bg-destructive' },
    { key: 'admin', label: 'Admin', color: 'border-info/30 bg-info/10 text-info', dot: 'bg-info' },
    { key: 'manager', label: 'Manager', color: 'border-success/30 bg-success/10 text-success', dot: 'bg-success' },
    { key: 'attendant', label: 'Attendant', color: 'border-primary/30 bg-primary/10 text-primary', dot: 'bg-primary' },
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
            <div className="flex items-center justify-center py-24">
                <Skeleton className="size-6 rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Roles & Permissions"
                description="Overview of access levels across all roles in the Paynest system."
            />

            {/* Role overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {roles.map((role) => {
                    const info = roleDescriptions[role.key];
                    return (
                        <Card key={role.key} className="p-5 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`size-2.5 rounded-full ${role.dot}`} />
                                <Badge className={`text-xs font-semibold border ${role.color}`}>
                                    {role.label}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{info.desc}</p>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="size-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{info.access}</span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Permissions matrix */}
            <Card className="rounded-2xl overflow-hidden p-0">
                <div className="px-6 py-4 border-b bg-muted/30">
                    <p className="font-semibold text-foreground text-sm">Permission Matrix</p>
                    <p className="text-xs text-muted-foreground mt-0.5">A comprehensive view of what each role can and cannot do.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/20">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-1/2">Permission</th>
                                {roles.map((role) => (
                                    <th key={role.key} className="text-center px-4 py-3 min-w-[100px]">
                                        <Badge className={`text-xs font-semibold border ${role.color}`}>
                                            {role.label}
                                        </Badge>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {rolePermissions.map((row) => (
                                <tr key={row.permission} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-3 text-foreground text-sm font-medium">{row.permission}</td>
                                    {(['superadmin', 'admin', 'manager', 'attendant'] as const).map((role) => (
                                        <td key={role} className="px-4 py-3 text-center">
                                            {row[role] ? (
                                                <CheckCircle2 className="size-4 text-success mx-auto" />
                                            ) : (
                                                <XCircle className="size-4 text-border mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                    {rolePermissions.length} permissions defined · Role changes require a re-login to take effect.
                </div>
            </Card>
        </div>
    );
}
