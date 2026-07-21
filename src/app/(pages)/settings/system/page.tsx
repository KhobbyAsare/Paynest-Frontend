"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import PageHeader from '@/components/(shared-components)/PageHeader';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Server, Database, Globe, Lock, Cpu, HardDrive,
    AlertTriangle, CheckCircle2, Zap, Users, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/apiClient';

const systemInfo = [
    {
        section: 'Application',
        icon: Globe,
        iconClass: 'text-info',
        bgClass: 'bg-info/10',
        items: [
            { label: 'Version', value: '1.0.0' },
            { label: 'Environment', value: 'Production', badge: 'border-success/30 bg-success/10 text-success' },
            { label: 'Framework', value: 'Next.js 16 (App Router)' },
            { label: 'API Base', value: API_BASE },
        ],
    },
    {
        section: 'Backend',
        icon: Server,
        iconClass: 'text-primary',
        bgClass: 'bg-primary/10',
        items: [
            { label: 'Runtime', value: 'FastAPI (Python 3.11+)' },
            { label: 'Auth', value: 'JWT Bearer Tokens' },
            { label: 'Password Hashing', value: 'bcrypt' },
            { label: 'CORS', value: 'Configured', badge: 'border-success/30 bg-success/10 text-success' },
        ],
    },
    {
        section: 'Database',
        icon: Database,
        iconClass: 'text-warning-foreground',
        bgClass: 'bg-warning/10',
        items: [
            { label: 'Engine', value: 'PostgreSQL' },
            { label: 'ORM', value: 'SQLAlchemy + Alembic' },
            { label: 'Migrations', value: 'Up to date', badge: 'border-success/30 bg-success/10 text-success' },
            { label: 'Multi-tenant', value: 'Organization isolation' },
        ],
    },
    {
        section: 'Security',
        icon: Lock,
        iconClass: 'text-destructive',
        bgClass: 'bg-destructive/10',
        items: [
            { label: 'Token Storage', value: 'HTTP-only cookie' },
            { label: 'Role System', value: 'SUPERADMIN → ADMIN → MANAGER → ATTENDANT' },
            { label: 'Token Revocation', value: 'Supported', badge: 'border-success/30 bg-success/10 text-success' },
            { label: 'Rate Limiting', value: 'Configured', badge: 'border-success/30 bg-success/10 text-success' },
        ],
    },
];

const planLimits = [
    { plan: 'FREE', users: 5, shops: 2, badge: 'border-border bg-muted text-muted-foreground', userBar: 10, shopBar: 10 },
    { plan: 'BASIC', users: 15, shops: 8, badge: 'border-info/30 bg-info/10 text-info', userBar: 30, shopBar: 40 },
    { plan: 'PRO', users: 25, shops: 15, badge: 'border-primary/30 bg-primary/10 text-primary', userBar: 50, shopBar: 75 },
    { plan: 'ENTERPRISE', users: 50, shops: 20, badge: 'border-warning/30 bg-warning/10 text-warning-foreground', userBar: 100, shopBar: 100 },
];

const infraNotes = [
    { ok: true, text: 'Multi-tenant architecture — each organization\'s data is logically isolated by organization_id.' },
    { ok: true, text: 'Reports generated server-side as PDF, Excel, CSV, or JSON via /reports/ endpoints.' },
    { ok: true, text: 'Daily closures workflow: open → submit → verify → close.' },
    { ok: false, text: 'No background job scheduler configured. All operations are synchronous.' },
    { ok: true, text: 'Email delivery configured via Gmail SMTP (password reset, order notifications, low stock alerts).' },
];

export default function SystemSettingsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'superadmin') router.replace('/dashboard');
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

            {/* ── Notice banner ──────────────────────────────────────────────── */}
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                <AlertTriangle className="size-4 text-warning-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-warning-foreground">
                    System configuration is managed via environment variables and backend settings.
                    This page is a <strong>read-only overview</strong> of the current configuration.
                </p>
            </div>

            {/* ── System info grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemInfo.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Card key={section.section} className="gap-0 p-0">
                            <CardHeader className="border-b px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", section.bgClass)}>
                                        <Icon className={cn("size-4", section.iconClass)} />
                                    </div>
                                    <CardTitle className="text-sm font-semibold">{section.section}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="px-5 py-4">
                                <dl className="space-y-3">
                                    {section.items.map(item => (
                                        <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                                            <dt className="text-muted-foreground shrink-0 text-xs">{item.label}</dt>
                                            <dd className="text-right">
                                                {item.badge ? (
                                                    <Badge variant="outline" className={cn('text-xs font-medium rounded-full', item.badge)}>
                                                        {item.value}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-foreground font-medium text-xs text-right">{item.value}</span>
                                                )}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Plan limits ────────────────────────────────────────────────── */}
            <Card className="gap-0 p-0">
                <CardHeader className="border-b px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Cpu className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">Subscription Plan Limits</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Maximum capacity per plan tier</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-5 py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {planLimits.map(p => (
                            <div key={p.plan} className="rounded-xl border p-4 space-y-3">
                                <Badge variant="outline" className={cn('text-xs font-semibold rounded-full', p.badge)}>
                                    {p.plan}
                                </Badge>
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Users className="size-3" /> Users
                                            </span>
                                            <span className="font-semibold text-foreground">{p.users}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${p.userBar}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Store className="size-3" /> Shops
                                            </span>
                                            <span className="font-semibold text-foreground">{p.shops}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div className="h-full rounded-full bg-info/60 transition-all" style={{ width: `${p.shopBar}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-success text-xs font-medium">
                                    <Zap className="size-3" /> Active
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ── Infrastructure notes ───────────────────────────────────────── */}
            <Card className="gap-0 p-0">
                <CardHeader className="border-b px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <HardDrive className="size-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Infrastructure Notes</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="px-5 py-4">
                    <ul className="space-y-3">
                        {infraNotes.map((note, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                                {note.ok
                                    ? <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
                                    : <AlertTriangle className="size-4 text-warning-foreground mt-0.5 shrink-0" />
                                }
                                <span className={note.ok ? 'text-muted-foreground' : 'text-warning-foreground'}>
                                    {note.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
