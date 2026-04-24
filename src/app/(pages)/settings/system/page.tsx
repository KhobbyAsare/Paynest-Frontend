"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import PageHeader from '@/components/(shared-components)/PageHeader';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Server,
    Database,
    Globe,
    Lock,
    Cpu,
    HardDrive,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';

const systemInfo = [
    {
        section: 'Application',
        icon: <Globe className="size-4 text-info" />,
        items: [
            { label: 'Version', value: '1.0.0' },
            { label: 'Environment', value: 'Production', badge: 'border-success/30 bg-success/10 text-success' },
            { label: 'Framework', value: 'Next.js 16 (App Router)' },
            { label: 'API Base', value: process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL || 'http://127.0.0.1:8000' },
        ],
    },
    {
        section: 'Backend',
        icon: <Server className="size-4 text-primary" />,
        items: [
            { label: 'Runtime', value: 'FastAPI (Python 3.11+)' },
            { label: 'Auth', value: 'JWT Bearer Tokens' },
            { label: 'Password Hashing', value: 'bcrypt' },
            { label: 'CORS', value: 'Configured' },
        ],
    },
    {
        section: 'Database',
        icon: <Database className="size-4 text-warning-foreground" />,
        items: [
            { label: 'Engine', value: 'PostgreSQL' },
            { label: 'ORM', value: 'SQLAlchemy + Alembic' },
            { label: 'Migrations', value: 'Up to date', badge: 'border-success/30 bg-success/10 text-success' },
            { label: 'Multi-tenant', value: 'Yes — Organization isolation' },
        ],
    },
    {
        section: 'Security',
        icon: <Lock className="size-4 text-destructive" />,
        items: [
            { label: 'Token Storage', value: 'HTTP-only cookie (pos_token)' },
            { label: 'Role System', value: 'SUPERADMIN → ADMIN → MANAGER → ATTENDANT' },
            { label: 'Token Revocation', value: 'Supported' },
            { label: 'Rate Limiting', value: 'Not configured', badge: 'border-warning/30 bg-warning/10 text-warning-foreground' },
        ],
    },
];

const planLimits = [
    { plan: 'FREE', users: 5, shops: 2, badge: 'bg-muted text-muted-foreground border' },
    { plan: 'BASIC', users: 15, shops: 8, badge: 'border-info/30 bg-info/10 text-info' },
    { plan: 'PRO', users: 25, shops: 15, badge: 'border-primary/30 bg-primary/10 text-primary' },
    { plan: 'ENTERPRISE', users: 50, shops: 20, badge: 'border-success/30 bg-success/10 text-success' },
];

export default function SystemSettingsPage() {
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
                title="System Settings"
                description="Platform configuration, infrastructure details, and subscription plan limits."
            />

            {/* Notice banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
                <AlertTriangle className="size-4 text-warning-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-warning-foreground">
                    System configuration is managed via environment variables and backend settings.
                    This page displays a read-only overview of the current configuration.
                </p>
            </div>

            {/* System info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemInfo.map((section) => (
                    <Card key={section.section} className="p-5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                            <div className="size-7 rounded-lg bg-muted flex items-center justify-center">
                                {section.icon}
                            </div>
                            <p className="font-semibold text-foreground text-sm">{section.section}</p>
                        </div>
                        <dl className="space-y-2.5">
                            {section.items.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                                    <dt className="text-muted-foreground shrink-0">{item.label}</dt>
                                    <dd className="text-right">
                                        {item.badge ? (
                                            <Badge className={`text-xs font-medium border ${item.badge}`}>
                                                {item.value}
                                            </Badge>
                                        ) : (
                                            <span className="text-foreground font-medium">{item.value}</span>
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Card>
                ))}
            </div>

            {/* Plan limits */}
            <Card className="p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-5">
                    <Cpu className="size-4 text-muted-foreground" />
                    <p className="font-semibold text-foreground">Subscription Plan Limits</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 pr-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                                <th className="text-center py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Users</th>
                                <th className="text-center py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Shops</th>
                                <th className="text-center py-2 pl-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {planLimits.map((p) => (
                                <tr key={p.plan}>
                                    <td className="py-3 pr-6">
                                        <Badge className={`font-semibold text-xs ${p.badge}`}>
                                            {p.plan}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-center font-medium text-foreground">{p.users}</td>
                                    <td className="py-3 px-4 text-center font-medium text-foreground">{p.shops}</td>
                                    <td className="py-3 pl-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-xs text-success">
                                            <CheckCircle2 className="size-3" />
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Infrastructure notes */}
            <Card className="p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <HardDrive className="size-4 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-sm">Infrastructure Notes</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-success mt-0.5 shrink-0" />
                        Multi-tenant architecture — each organization&apos;s data is logically isolated by <code className="text-xs bg-muted px-1 rounded">organization_id</code>.
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-success mt-0.5 shrink-0" />
                        Reports are generated server-side as PDF, Excel, CSV, or JSON via <code className="text-xs bg-muted px-1 rounded">/reports/</code> endpoints.
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-success mt-0.5 shrink-0" />
                        Daily closures workflow: <code className="text-xs bg-muted px-1 rounded">open → submit → verify → close</code>.
                    </li>
                    <li className="flex items-start gap-2">
                        <AlertTriangle className="size-3.5 text-warning-foreground mt-0.5 shrink-0" />
                        No background job scheduler configured. All operations are synchronous.
                    </li>
                    <li className="flex items-start gap-2">
                        <AlertTriangle className="size-3.5 text-warning-foreground mt-0.5 shrink-0" />
                        Email delivery not yet configured (password reset, order notifications).
                    </li>
                </ul>
            </Card>
        </div>
    );
}
