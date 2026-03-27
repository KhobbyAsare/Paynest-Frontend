"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import PageHeader from '@/components/(shared-components)/PageHeader';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Server,
    Database,
    Globe,
    Lock,
    Cpu,
    HardDrive,
    AlertTriangle,
    CheckCircle2,
    RefreshCcw,
} from 'lucide-react';

const systemInfo = [
    {
        section: 'Application',
        icon: <Globe className="size-4 text-blue-500" />,
        items: [
            { label: 'Version', value: '1.0.0' },
            { label: 'Environment', value: 'Production', badge: 'bg-emerald-100 text-emerald-700' },
            { label: 'Framework', value: 'Next.js 16 (App Router)' },
            { label: 'API Base', value: process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL || 'http://127.0.0.1:8000' },
        ],
    },
    {
        section: 'Backend',
        icon: <Server className="size-4 text-purple-500" />,
        items: [
            { label: 'Runtime', value: 'FastAPI (Python 3.11+)' },
            { label: 'Auth', value: 'JWT Bearer Tokens' },
            { label: 'Password Hashing', value: 'bcrypt' },
            { label: 'CORS', value: 'Configured' },
        ],
    },
    {
        section: 'Database',
        icon: <Database className="size-4 text-amber-500" />,
        items: [
            { label: 'Engine', value: 'PostgreSQL' },
            { label: 'ORM', value: 'SQLAlchemy + Alembic' },
            { label: 'Migrations', value: 'Up to date', badge: 'bg-emerald-100 text-emerald-700' },
            { label: 'Multi-tenant', value: 'Yes — Organization isolation' },
        ],
    },
    {
        section: 'Security',
        icon: <Lock className="size-4 text-rose-500" />,
        items: [
            { label: 'Token Storage', value: 'HTTP-only cookie (pos_token)' },
            { label: 'Role System', value: 'SUPERADMIN → ADMIN → MANAGER → ATTENDANT' },
            { label: 'Token Revocation', value: 'Supported' },
            { label: 'Rate Limiting', value: 'Not configured', badge: 'bg-amber-100 text-amber-700' },
        ],
    },
];

const planLimits = [
    { plan: 'FREE', users: 5, shops: 2, badge: 'bg-slate-100 text-slate-600' },
    { plan: 'BASIC', users: 15, shops: 8, badge: 'bg-blue-100 text-blue-700' },
    { plan: 'PRO', users: 25, shops: 15, badge: 'bg-purple-100 text-purple-700' },
    { plan: 'ENTERPRISE', users: 50, shops: 20, badge: 'bg-emerald-100 text-emerald-700' },
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
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <RefreshCcw className="size-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="mt-8 space-y-6 max-w-4xl mx-auto">
                <PageHeader
                    title="System Settings"
                    description="Platform configuration, infrastructure details, and subscription plan limits."
                />

                {/* Notice banner */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700">
                        System configuration is managed via environment variables and backend settings.
                        This page displays a read-only overview of the current configuration.
                    </p>
                </div>

                {/* System info cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {systemInfo.map((section) => (
                        <Card key={section.section} className="p-5 rounded-2xl border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                                <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center">
                                    {section.icon}
                                </div>
                                <p className="font-semibold text-slate-900 text-sm">{section.section}</p>
                            </div>
                            <dl className="space-y-2.5">
                                {section.items.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                                        <dt className="text-slate-400 shrink-0">{item.label}</dt>
                                        <dd className="text-right">
                                            {item.badge ? (
                                                <Badge className={`text-xs font-medium border-none ${item.badge}`}>
                                                    {item.value}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-700 font-medium">{item.value}</span>
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>
                    ))}
                </div>

                {/* Plan limits */}
                <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Cpu className="size-4 text-slate-500" />
                        <p className="font-semibold text-slate-900">Subscription Plan Limits</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-2 pr-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Plan</th>
                                    <th className="text-center py-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Max Users</th>
                                    <th className="text-center py-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Max Shops</th>
                                    <th className="text-center py-2 pl-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {planLimits.map((p) => (
                                    <tr key={p.plan}>
                                        <td className="py-3 pr-6">
                                            <Badge className={`font-semibold text-xs border-none ${p.badge}`}>
                                                {p.plan}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-slate-700">{p.users}</td>
                                        <td className="py-3 px-4 text-center font-medium text-slate-700">{p.shops}</td>
                                        <td className="py-3 pl-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
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

                {/* Storage info */}
                <Card className="p-5 rounded-2xl border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <HardDrive className="size-4 text-slate-500" />
                        <p className="font-semibold text-slate-900 text-sm">Infrastructure Notes</p>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            Multi-tenant architecture — each organization&apos;s data is logically isolated by <code className="text-xs bg-slate-100 px-1 rounded">organization_id</code>.
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            Reports are generated server-side as PDF, Excel, CSV, or JSON via <code className="text-xs bg-slate-100 px-1 rounded">/reports/</code> endpoints.
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            Daily closures workflow: <code className="text-xs bg-slate-100 px-1 rounded">open → submit → verify → close</code>.
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                            No background job scheduler configured. All operations are synchronous.
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                            Email delivery not yet configured (password reset, order notifications).
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}
