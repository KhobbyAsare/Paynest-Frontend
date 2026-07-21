"use client"

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    getSuperAdminDashboard,
    getSuperAdminSystemHealth,
    getSuperAdminTopProducts,
    getSuperAdminUsersWithoutProfile,
} from '@/(api-handlers)/superadminHandler';
import {
    SuperAdminDashboardResponse,
    OrgMetrics,
    PlatformTrend,
    SystemHealth,
    TopProduct,
    UserWithoutProfile,
} from '@/interfaces/superadminDashboard';
import {
    Building2, Users, ShoppingCart, DollarSign,
    Store, TrendingUp, Activity, RefreshCcw,
    ArrowUpRight, UserPlus, BadgeCheck, CheckCircle2,
    XCircle, Medal, Server, Database, Clock, Wifi,
    Package, AlertCircle, UserX, AlertTriangle,
    BarChart2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/(shared-components)/PageHeader';
import StatsGrid from '@/components/(shared-components)/StatsGrid';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

// Recharts — dynamically imported to avoid SSR
const AreaChart           = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area                = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const PieChart            = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie                 = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell                = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });

// ─── Constants ───────────────────────────────────────────────────────────────
const RANGES = [
    { label: '7D',  days: 7  },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
];

const CHART_PRIMARY = 'var(--primary)';
const CHART_INFO    = 'var(--info)';

const PIE_PALETTE = [
    'var(--muted-foreground)',
    'var(--info)',
    'var(--primary)',
    'var(--warning)',
];

const PLAN_ORDER = ['free', 'basic', 'pro', 'enterprise'];

const PLAN_BADGE: Record<string, string> = {
    free:       'border-border bg-muted text-muted-foreground',
    basic:      'border-info/30 bg-info/10 text-info',
    pro:        'border-primary/30 bg-primary/10 text-primary',
    enterprise: 'border-warning/30 bg-warning/10 text-warning-foreground',
};

const fmt      = (n: number) => formatCurrency(n, 'GHS');
const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `GHS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `GHS ${(n / 1_000).toFixed(1)}K`;
    return fmt(n);
};

const axisStyle = { fontSize: 10, fill: 'var(--muted-foreground)' };

// ─── Pie Tooltip ─────────────────────────────────────────────────────────────
function PieTooltip({ active, payload }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { color: string } }[];
}) {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
        <div className="bg-card border-border rounded-xl border p-3 shadow-lg text-xs">
            <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.payload.color }} />
                <span className="text-foreground font-semibold">{entry.name}</span>
                <span className="text-muted-foreground">— {entry.value} {entry.value === 1 ? 'org' : 'orgs'}</span>
            </div>
        </div>
    );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number; name: string }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border-border rounded-xl border p-3 shadow-lg text-xs">
            <p className="text-foreground mb-2 font-semibold">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex justify-between gap-6">
                    <span className="text-muted-foreground capitalize">{p.name}</span>
                    <span className="text-foreground font-semibold num-tabular">
                        {p.name === 'revenue' ? fmtShort(p.value) : p.value.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Hero metric cell ─────────────────────────────────────────────────────────
function HeroMetric({
    icon: Icon, label, value, sub, loading, accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    loading?: boolean;
    accent?: string;
}) {
    return (
        <div className="flex flex-col gap-2 px-6 py-1 first:pl-0 last:pr-0">
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', accent ?? 'text-muted-foreground')}>
                <Icon className="size-3.5 shrink-0" />
                {label}
            </div>
            {loading ? (
                <Skeleton className="h-7 w-24" />
            ) : (
                <p className="text-[22px] font-bold text-foreground leading-none">{value}</p>
            )}
            {sub && !loading && (
                <p className="text-[11px] text-muted-foreground">{sub}</p>
            )}
            {loading && <Skeleton className="h-3 w-16" />}
        </div>
    );
}

// ─── Top Orgs ranked list ──────────────────────────────────────────────────────
function TopOrgsList({
    orgs, loading,
}: {
    orgs: { name: string; revenue: number; orders: number }[];
    loading: boolean;
}) {
    const maxRev = Math.max(...orgs.map(o => o.revenue), 1);

    return (
        <Card className="gap-0 overflow-hidden flex flex-col">
            <CardHeader className="border-b px-5 py-4 shrink-0">
                <CardTitle className="text-sm font-semibold">Top Orgs</CardTitle>
                <CardDescription className="text-xs">By revenue this period</CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-4 flex-1">
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : orgs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No data for this period
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {orgs.map((org, i) => (
                            <div key={i} className="space-y-1.5 group">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={cn(
                                            'size-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
                                            i === 0 ? 'bg-warning/10 text-warning-foreground' :
                                            i === 1 ? 'bg-muted-foreground/10 text-muted-foreground' :
                                            i === 2 ? 'bg-primary/10 text-primary' :
                                            'bg-muted text-muted-foreground',
                                        )}>
                                            {i + 1}
                                        </span>
                                        <span className="text-foreground font-medium truncate">{org.name}</span>
                                    </div>
                                    <span className="text-foreground font-semibold shrink-0">{fmtShort(org.revenue)}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-700',
                                            i === 0 ? 'bg-warning/70' :
                                            i === 1 ? 'bg-muted-foreground/50' :
                                            i === 2 ? 'bg-primary/60' :
                                            'bg-primary/40',
                                        )}
                                        style={{ width: `${(org.revenue / maxRev) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES = {
    healthy:  { dot: 'bg-success',     text: 'text-success',     label: 'Healthy' },
    degraded: { dot: 'bg-warning',     text: 'text-warning-foreground', label: 'Degraded' },
    down:     { dot: 'bg-destructive', text: 'text-destructive', label: 'Down' },
};

// ─── System Health card ───────────────────────────────────────────────────────
function SystemHealthCard({ health, loading }: { health: SystemHealth | null; loading: boolean }) {
    const apiSt  = health ? STATUS_STYLES[health.api_status] : null;
    const dbSt   = health ? STATUS_STYLES[health.db_status]  : null;

    const metrics = health ? [
        { icon: Wifi,     label: 'API',              value: health.api_status,     style: apiSt!,  isStatus: true },
        { icon: Database, label: 'Database',          value: health.db_status,      style: dbSt!,   isStatus: true },
        { icon: Clock,    label: 'Avg Response',      value: `${health.avg_response_time_ms} ms`, style: null, isStatus: false },
        { icon: Activity, label: 'Uptime',            value: `${health.uptime_percent.toFixed(2)}%`, style: null, isStatus: false },
        { icon: BarChart2,label: 'Requests Today',    value: health.total_requests_today.toLocaleString(), style: null, isStatus: false },
        { icon: AlertTriangle, label: 'Error Rate',   value: `${health.error_rate_percent.toFixed(2)}%`, style: health.error_rate_percent > 5 ? STATUS_STYLES.degraded : health.error_rate_percent > 15 ? STATUS_STYLES.down : STATUS_STYLES.healthy, isStatus: true },
    ] : [];

    return (
        <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                            <Server className="size-3.5 text-info" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">System Health</CardTitle>
                            <CardDescription className="text-xs">
                                {health ? `Last checked ${new Date(health.last_checked).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Live status'}
                            </CardDescription>
                        </div>
                    </div>
                    {health && (
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-xs font-medium',
                                health.api_status === 'healthy' && health.db_status === 'healthy'
                                    ? 'border-success/30 bg-success/10 text-success'
                                    : 'border-warning/30 bg-warning/10 text-warning-foreground',
                            )}
                        >
                            <span className={cn('size-1.5 rounded-full mr-1.5 inline-block',
                                health.api_status === 'healthy' && health.db_status === 'healthy'
                                    ? 'bg-success animate-pulse' : 'bg-warning')}
                            />
                            {health.api_status === 'healthy' && health.db_status === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-6 py-5">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                ) : !health ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                        <AlertCircle className="size-4 shrink-0" />
                        Health endpoint unavailable — check backend connectivity
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 divide-x-0 lg:divide-x lg:divide-border/50">
                        {metrics.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <div key={i} className="flex flex-col gap-1.5 lg:px-4 first:pl-0 last:pr-0">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Icon className="size-3.5 shrink-0" />
                                        {m.label}
                                    </div>
                                    {m.isStatus && m.style ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn('size-2 rounded-full shrink-0 animate-pulse', m.style.dot)} />
                                            <span className={cn('text-sm font-semibold capitalize', m.style.text)}>
                                                {m.style.label}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-semibold text-foreground">{m.value}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Top Products card ────────────────────────────────────────────────────────
function TopProductsCard({ products, loading }: { products: TopProduct[]; loading: boolean }) {
    const maxQty = Math.max(...products.map(p => p.total_quantity_sold), 1);

    return (
        <Card className="gap-0 overflow-hidden p-0 flex flex-col">
            <CardHeader className="border-b px-5 py-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="size-3.5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
                        <CardDescription className="text-xs">Most purchased across all organizations</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 py-0 flex-1">
                {loading ? (
                    <div className="space-y-0 divide-y divide-border/50">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                                <Skeleton className="size-6 rounded-md shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-2 w-full rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-16 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                        <Package className="size-8 opacity-30" />
                        <p className="text-sm">No product data for this period</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {products.map((p, i) => (
                            <div key={p.product_id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                                <span className={cn(
                                    'size-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
                                    i === 0 ? 'bg-warning/10 text-warning-foreground' :
                                    i === 1 ? 'bg-muted-foreground/10 text-muted-foreground' :
                                    i === 2 ? 'bg-primary/10 text-primary' :
                                    'bg-muted text-muted-foreground',
                                )}>
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-foreground truncate">{p.product_name}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">{p.total_quantity_sold.toLocaleString()} units</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-700',
                                                    i === 0 ? 'bg-warning/70' : i === 1 ? 'bg-muted-foreground/50' : i === 2 ? 'bg-primary/60' : 'bg-primary/35',
                                                )}
                                                style={{ width: `${(p.total_quantity_sold / maxQty) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] text-muted-foreground shrink-0 w-24 text-right">{fmtShort(p.total_revenue)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Advanced metrics mini-cards ──────────────────────────────────────────────
function AdvancedMetrics({ data, loading }: { data: SuperAdminDashboardResponse | null; loading: boolean }) {
    const s = data?.summary;

    const metrics = s ? [
        {
            name: 'Avg Revenue / Org',
            value: s.active_organizations > 0 ? fmtShort(s.total_revenue / s.active_organizations) : '—',
            change: 'Active orgs only',
        },
        {
            name: 'Avg Shops / Org',
            value: s.total_organizations > 0 ? (s.total_shops / s.total_organizations).toFixed(1) : '—',
            change: 'All organizations',
        },
        {
            name: 'Avg Users / Org',
            value: s.total_organizations > 0 ? (s.total_users / s.total_organizations).toFixed(1) : '—',
            change: 'All organizations',
        },
        {
            name: 'New Orgs (Period)',
            value: s.new_orgs_in_period.toLocaleString(),
            change: `of ${s.total_organizations} total`,
        },
    ] as const : [];

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-4">
                        <Skeleton className="h-3 w-24 mb-3" />
                        <Skeleton className="h-6 w-20 mb-1" />
                        <Skeleton className="h-2.5 w-16" />
                    </Card>
                ))}
            </div>
        );
    }

    return <StatsGrid columns={2} stats={metrics.map(m => ({ ...m, changeType: 'neutral' as const }))} />;
}

// ─── Users Without Profile table ──────────────────────────────────────────────
function UsersWithoutProfileCard({ users, loading }: { users: UserWithoutProfile[]; loading: boolean }) {
    return (
        <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                            <UserX className="size-3.5 text-warning-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">Users Without Employee Profile</CardTitle>
                            <CardDescription className="text-xs">
                                Registered users who haven&apos;t set up an employee profile yet
                            </CardDescription>
                        </div>
                    </div>
                    {!loading && users.length > 0 && (
                        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning-foreground text-xs">
                            {users.length} {users.length === 1 ? 'user' : 'users'} pending
                        </Badge>
                    )}
                </div>
            </CardHeader>
            {loading ? (
                <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
            ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
                    <div className="size-12 rounded-full bg-success/10 flex items-center justify-center mb-1">
                        <CheckCircle2 className="size-6 text-success" />
                    </div>
                    <p className="text-sm font-medium text-foreground">All users have employee profiles</p>
                    <p className="text-xs">No action required</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.user_id} className="hover:bg-muted/40 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                                                <UserX className="size-3.5 text-warning-foreground" />
                                            </div>
                                            <span className="font-medium text-sm text-foreground">{u.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('capitalize text-xs', PLAN_BADGE[u.role.toLowerCase()] ?? 'border-border bg-muted text-muted-foreground')}>
                                            {u.role.toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                                            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                                            {u.org_name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(u.registered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/users/setup-employee-profile?user_id=${u.user_id}`}
                                            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                                        >
                                            Set up profile <ArrowUpRight className="size-3" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </Card>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const SuperAdminView = () => {
    const [data, setData]             = useState<SuperAdminDashboardResponse | null>(null);
    const [loading, setLoading]       = useState(true);
    const [range, setRange]           = useState(30);
    const [customDates, setCustomDates] = useState<[Dayjs, Dayjs] | null>(null);

    const [health, setHealth]                   = useState<SystemHealth | null>(null);
    const [healthLoading, setHealthLoading]     = useState(true);
    const [topProducts, setTopProducts]         = useState<TopProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [usersNoProfile, setUsersNoProfile]   = useState<UserWithoutProfile[]>([]);
    const [usersLoading, setUsersLoading]       = useState(true);

    const load = useCallback(async (days: number, custom?: [Dayjs, Dayjs]) => {
        setLoading(true);
        try {
            let startStr: string, endStr: string;
            if (custom) {
                startStr = custom[0].format('YYYY-MM-DD');
                endStr   = custom[1].format('YYYY-MM-DD');
            } else {
                const end   = new Date();
                const start = new Date();
                start.setDate(end.getDate() - days);
                startStr = start.toISOString().split('T')[0];
                endStr   = end.toISOString().split('T')[0];
            }
            const [dashboardData, productsData] = await Promise.allSettled([
                getSuperAdminDashboard(startStr, endStr),
                getSuperAdminTopProducts(startStr, endStr, 10),
            ]);
            if (dashboardData.status === 'fulfilled') setData(dashboardData.value);
            if (productsData.status === 'fulfilled') setTopProducts(productsData.value);
            else setTopProducts([]);
        } catch {
            // silent — dashboard is best-effort
        } finally {
            setLoading(false);
            setProductsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (customDates) load(0, customDates);
        else load(range);
    }, [load, range, customDates]);

    useEffect(() => {
        setHealthLoading(true);
        getSuperAdminSystemHealth()
            .then(setHealth)
            .catch(() => setHealth(null))
            .finally(() => setHealthLoading(false));
    }, []);

    useEffect(() => {
        setUsersLoading(true);
        getSuperAdminUsersWithoutProfile()
            .then(setUsersNoProfile)
            .catch(() => setUsersNoProfile([]))
            .finally(() => setUsersLoading(false));
    }, []);

    const s = data?.summary;

    // ── Trend data ─────────────────────────────────────────────────────────────
    const trendData: (PlatformTrend & { date: string })[] = (data?.platform_trends ?? []).map(t => ({
        ...t,
        date: new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: Number(t.revenue.toFixed(2)),
    }));

    const visibleTrend = range > 30
        ? trendData.filter((_, i) => i % 3 === 0)
        : range > 14
            ? trendData.filter((_, i) => i % 2 === 0)
            : trendData;

    // ── Plan distribution ──────────────────────────────────────────────────────
    const planData = PLAN_ORDER.map((plan, i) => {
        const found = (data?.plan_distribution ?? []).find(p => p.plan === plan);
        return {
            name:  plan.charAt(0).toUpperCase() + plan.slice(1),
            count: found?.count ?? 0,
            color: PIE_PALETTE[i],
        };
    }).filter(p => p.count > 0);

    // ── Top orgs (ranked list) ─────────────────────────────────────────────────
    const topOrgs = (data?.org_metrics ?? []).slice(0, 7).map(o => ({
        name:    o.org_name.length > 20 ? o.org_name.slice(0, 18) + '…' : o.org_name,
        revenue: Number(o.total_revenue.toFixed(2)),
        orders:  o.total_orders,
    }));

    const avgOrderValue = s && s.total_orders > 0
        ? fmtShort(s.total_revenue / s.total_orders)
        : '—';

    return (
        <div className="flex flex-col gap-6">
            {/* ── Page Header ────────────────────────────────────────────────── */}
            <PageHeader
                title="Platform Overview"
                description="System-wide analytics across all organizations"
                separator={false}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <ToggleGroup
                            type="single"
                            value={customDates ? 'custom' : String(range)}
                            onValueChange={v => {
                                if (!v || v === 'custom') return;
                                setCustomDates(null);
                                setRange(Number(v));
                            }}
                            variant="outline"
                            size="sm"
                        >
                            {RANGES.map(r => (
                                <ToggleGroupItem key={r.days} value={String(r.days)}>
                                    {r.label}
                                </ToggleGroupItem>
                            ))}
                            <ToggleGroupItem
                                value="custom"
                                className={cn(customDates && 'bg-primary text-primary-foreground hover:bg-primary/90')}
                            >
                                Custom
                            </ToggleGroupItem>
                        </ToggleGroup>

                        {customDates !== null && (
                            <DatePicker.RangePicker
                                value={customDates}
                                onChange={dates => {
                                    if (dates?.[0] && dates?.[1]) setCustomDates([dates[0], dates[1]]);
                                    else setCustomDates(null);
                                }}
                                format="DD MMM YYYY"
                                size="small"
                                allowClear={false}
                            />
                        )}

                        {customDates === null && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground h-8 px-2 text-xs"
                                onClick={() => setCustomDates([dayjs().subtract(range, 'day'), dayjs()])}
                            >
                                Custom…
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => {
                                if (customDates) load(0, customDates); else load(range);
                                setHealthLoading(true);
                                getSuperAdminSystemHealth().then(setHealth).catch(() => setHealth(null)).finally(() => setHealthLoading(false));
                                setUsersLoading(true);
                                getSuperAdminUsersWithoutProfile().then(setUsersNoProfile).catch(() => setUsersNoProfile([])).finally(() => setUsersLoading(false));
                            }}
                            aria-label="Refresh dashboard"
                        >
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                    </div>
                }
            />

            {/* ── Hero stats strip ───────────────────────────────────────────── */}
            <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent p-0">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-10 -right-10 size-52 rounded-full bg-primary/5 blur-3xl" />
                    <div className="absolute -bottom-8 left-1/4 size-40 rounded-full bg-info/5 blur-3xl" />
                </div>
                <CardContent className="relative px-6 py-6">
                    <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-border/50 lg:gap-y-0">
                        <HeroMetric
                            icon={DollarSign}
                            label="Platform Revenue"
                            value={s ? fmtShort(s.total_revenue) : '—'}
                            sub={`${customDates ? 'Custom range' : `${range}d window`}`}
                            loading={loading}
                            accent="text-primary"
                        />
                        <HeroMetric
                            icon={ShoppingCart}
                            label="Total Orders"
                            value={s ? s.total_orders.toLocaleString() : '—'}
                            sub={`Avg ${avgOrderValue} per order`}
                            loading={loading}
                        />
                        <HeroMetric
                            icon={Building2}
                            label="Organizations"
                            value={s ? s.total_organizations.toLocaleString() : '—'}
                            sub={s ? `${s.active_organizations} active · +${s.new_orgs_in_period} new` : undefined}
                            loading={loading}
                        />
                        <HeroMetric
                            icon={Users}
                            label="Total Users"
                            value={s ? s.total_users.toLocaleString() : '—'}
                            sub={s ? `${s.active_users} active · +${s.new_users_in_period} new` : undefined}
                            loading={loading}
                        />
                        <HeroMetric
                            icon={Store}
                            label="Total Shops"
                            value={s ? s.total_shops.toLocaleString() : '—'}
                            sub="Across all organizations"
                            loading={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Revenue trend — centrepiece ────────────────────────────────── */}
            <Card className="gap-0 overflow-hidden p-0">
                <CardHeader className="border-b px-6 py-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Total Platform Revenue</p>
                            {loading ? (
                                <Skeleton className="h-9 w-40 mb-2" />
                            ) : (
                                <p className="text-3xl font-bold text-foreground leading-none">
                                    {fmtShort(s?.total_revenue ?? 0)}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                                {loading ? '' : `${(s?.total_orders ?? 0).toLocaleString()} orders · avg ${avgOrderValue} per order`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs font-medium">
                                <TrendingUp className="size-3 mr-1" /> Revenue Trend
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="px-6 pb-6 pt-4">
                            <Skeleton className="h-72 w-full rounded-xl" />
                        </div>
                    ) : visibleTrend.length === 0 ? (
                        <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
                            No trend data for selected period
                        </div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visibleTrend} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="saRevGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%"   stopColor={CHART_PRIMARY} stopOpacity={0.35} />
                                            <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={axisStyle}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                        padding={{ left: 16, right: 16 }}
                                    />
                                    <YAxis
                                        tick={axisStyle}
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke={CHART_PRIMARY}
                                        strokeWidth={2.5}
                                        fill="url(#saRevGrad)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: CHART_PRIMARY, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Secondary row: Plan donut · Daily orders · Top orgs ────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Plan Distribution donut */}
                <Card className="gap-0 overflow-hidden p-0">
                    <CardHeader className="border-b px-5 py-4">
                        <CardTitle className="text-sm font-semibold">Plan Distribution</CardTitle>
                        <CardDescription className="text-xs">Organizations by subscription tier</CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 py-4">
                        {loading ? (
                            <Skeleton className="h-52 w-full rounded-xl" />
                        ) : planData.length === 0 ? (
                            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                                No data
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="h-44">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={planData}
                                                cx="50%" cy="50%"
                                                innerRadius={48} outerRadius={72}
                                                paddingAngle={3}
                                                dataKey="count"
                                                nameKey="name"
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {planData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<PieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {planData.map((p, i) => (
                                        <span
                                            key={i}
                                            className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', PLAN_BADGE[p.name.toLowerCase()])}
                                        >
                                            {p.name} · {p.count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Daily Orders bar */}
                <Card className="gap-0 overflow-hidden p-0">
                    <CardHeader className="border-b px-5 py-4">
                        <CardTitle className="text-sm font-semibold">Daily Orders</CardTitle>
                        <CardDescription className="text-xs">Total orders processed per day</CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 py-4">
                        {loading ? (
                            <Skeleton className="h-52 w-full rounded-xl" />
                        ) : visibleTrend.length === 0 ? (
                            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                                No data for this period
                            </div>
                        ) : (
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={visibleTrend}
                                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                                        barSize={range <= 14 ? 18 : range <= 30 ? 9 : 5}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
                                        <Bar dataKey="orders" fill={CHART_INFO} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top orgs ranked list */}
                <TopOrgsList orgs={topOrgs} loading={loading} />
            </div>

            {/* ── System Health ───────────────────────────────────────────────── */}
            <SystemHealthCard health={health} loading={healthLoading} />

            {/* ── Top Products + Advanced Metrics ─────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <TopProductsCard products={topProducts} loading={productsLoading} />
                </div>
                <AdvancedMetrics data={data} loading={loading} />
            </div>

            {/* ── Users Without Employee Profile ───────────────────────────────── */}
            <UsersWithoutProfileCard users={usersNoProfile} loading={usersLoading} />

            {/* ── Organization Leaderboard ────────────────────────────────────── */}
            {!loading && (data?.org_metrics ?? []).length > 0 && (
                <OrgLeaderboard orgs={data!.org_metrics} />
            )}

            {/* ── Empty state ─────────────────────────────────────────────────── */}
            {!loading && !data && (
                <Card className="py-16 p-0">
                    <CardContent className="flex flex-col items-center gap-3 text-center">
                        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                            <Activity className="text-muted-foreground size-7" />
                        </div>
                        <div>
                            <p className="text-foreground font-medium">No platform data yet</p>
                            <p className="text-muted-foreground text-sm mt-1">
                                Data will appear once organizations are onboarded and orders are placed.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// ─── Organization Leaderboard table ───────────────────────────────────────────
function OrgLeaderboard({ orgs }: { orgs: OrgMetrics[] }) {
    return (
        <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                                <Medal className="size-3.5 text-warning-foreground" />
                            </div>
                            <CardTitle className="text-sm font-semibold">Organization Leaderboard</CardTitle>
                        </div>
                        <CardDescription className="text-xs mt-1 ml-9">
                            All organizations ranked by revenue in the selected period
                        </CardDescription>
                    </div>
                    <Link
                        href="/organizations"
                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                        Manage orgs <ArrowUpRight className="size-3" />
                    </Link>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8 text-center">#</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Orders</TableHead>
                            <TableHead className="text-right">Shops</TableHead>
                            <TableHead className="text-right">Users</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orgs.map((org, i) => (
                            <TableRow
                                key={org.org_id}
                                className="transition-colors hover:bg-muted/40"
                            >
                                <TableCell className="text-center">
                                    <span className={cn(
                                        'inline-flex size-6 items-center justify-center rounded-md text-[11px] font-bold',
                                        i === 0 ? 'bg-warning/10 text-warning-foreground' :
                                        i === 1 ? 'bg-muted-foreground/10 text-muted-foreground' :
                                        i === 2 ? 'bg-primary/10 text-primary' :
                                        'text-muted-foreground',
                                    )}>
                                        {i + 1}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                            <Building2 className="text-primary size-3.5" />
                                        </div>
                                        <span className="text-foreground font-medium text-sm">{org.org_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn('capitalize rounded-full text-xs font-medium', PLAN_BADGE[org.plan_type])}
                                    >
                                        {org.plan_type === 'enterprise' && <BadgeCheck className="size-3 mr-1" />}
                                        {org.plan_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <p className="text-success num-tabular font-semibold text-sm">
                                        {fmt(org.total_revenue)}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right num-tabular font-medium text-sm">
                                    {org.total_orders.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right num-tabular font-medium text-sm">
                                    {org.total_shops}
                                </TableCell>
                                <TableCell className="text-right num-tabular font-medium text-sm">
                                    <span className="inline-flex items-center gap-1">
                                        <UserPlus className="size-3 text-muted-foreground" />
                                        {org.total_users}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {org.is_active ? (
                                        <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                                            <CheckCircle2 className="size-3.5" /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                                            <XCircle className="size-3.5" /> Inactive
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {org.joined_at
                                        ? new Date(org.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
