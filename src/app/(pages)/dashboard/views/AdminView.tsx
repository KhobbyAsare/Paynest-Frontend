"use client"

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GetFinanceOverview } from '@/(api-handlers)/financeHandler';
import { GetInventoryStatistics } from '@/(api-handlers)/inventoryHandler';
import { FinanceOverviewResponse } from '@/interfaces/finance';
import { InventoryStats } from '@/interfaces/inventory';
import {
    TrendingUp, ShoppingCart, DollarSign,
    Package, AlertTriangle, XCircle, RefreshCcw,
    Store, ArrowUpRight, Activity, Percent, TrendingDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { StatCard } from '@/components/(shared-components)/StatCard';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { cn } from '@/lib/utils';
import { useCurrency, useOrgCurrency } from '@/hooks/useCurrency';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

// Dynamically import recharts to avoid SSR issues
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });

const RANGES = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
];

// Brand palette for charts — CSS vars are oklch values, use var() directly
const CHART_PRIMARY = 'var(--primary)';
const CHART_INFO    = 'var(--info)';
const PIE_COLORS = [
    'var(--primary)',
    'var(--info)',
    'var(--success)',
    'var(--warning)',
    'var(--destructive)',
    'oklch(0.627 0.265 303.9)',
    'oklch(0.645 0.246 16.439)',
];

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number; name: string }[];
    label?: string;
}) {
    const fmt = useCurrency();
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border-border rounded-xl border p-3 shadow-lg text-xs">
            <p className="text-foreground mb-2 font-semibold">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex justify-between gap-6">
                    <span className="text-muted-foreground capitalize">{p.name}</span>
                    <span className="text-foreground font-semibold num-tabular">
                        {p.name === 'revenue' ? fmt(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Chart container card ─────────────────────────────────────────────────────
function ChartCard({
    title, subtitle, children, loading, empty, className,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    loading?: boolean;
    empty?: boolean;
    className?: string;
}) {
    return (
        <Card className={cn('gap-0 overflow-hidden', className)}>
            <CardHeader className="border-border border-b px-6 py-4">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent className="p-6">
                {loading ? (
                    <Skeleton className="h-56 w-full rounded-lg" />
                ) : empty ? (
                    <div className="text-muted-foreground flex h-56 items-center justify-center text-sm">
                        No data for selected period
                    </div>
                ) : children}
            </CardContent>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const AdminView = () => {
    const [finance, setFinance] = useState<FinanceOverviewResponse | null>(null);
    const [invStats, setInvStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState(30);
    const [customDates, setCustomDates] = useState<[Dayjs, Dayjs] | null>(null);

    const load = useCallback(async (days: number, custom?: [Dayjs, Dayjs]) => {
        setLoading(true);
        try {
            const fmt = (d: Date) => d.toISOString().split('T')[0];
            let startStr: string;
            let endStr: string;
            if (custom) {
                startStr = custom[0].format('YYYY-MM-DD');
                endStr   = custom[1].format('YYYY-MM-DD');
            } else {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - days);
                startStr = fmt(start);
                endStr   = fmt(end);
            }
            const [fin, inv] = await Promise.all([
                GetFinanceOverview(undefined, startStr, endStr),
                GetInventoryStatistics(),
            ]);
            setFinance(fin);
            setInvStats(inv);
        } catch {
            // Dashboard is informational — silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (customDates) load(0, customDates);
        else load(range);
    }, [load, range, customDates]);

    const s = finance?.summary;
    const avgOrderValue = s && s.total_orders > 0 ? s.total_revenue / s.total_orders : 0;
    const profitMargin  = s && s.total_revenue > 0 ? (s.gross_profit / s.total_revenue) * 100 : 0;

    const fmt      = useCurrency();
    const currency = useOrgCurrency();
    const fmtShort = (n: number) => {
        if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000)     return `${currency} ${(n / 1_000).toFixed(1)}K`;
        return fmt(n);
    };

    const trendData = (finance?.trends ?? []).map(t => ({
        date: new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: Number(t.revenue.toFixed(2)),
        orders: t.orders,
    }));

    const visibleTrend = range > 30
        ? trendData.filter((_, i) => i % 3 === 0)
        : range > 14
            ? trendData.filter((_, i) => i % 2 === 0)
            : trendData;

    const shopData = (finance?.shop_breakdown ?? []).map(sh => ({
        name: sh.shop_name,
        revenue: Number(sh.revenue.toFixed(2)),
        orders: sh.orders_count,
        profit: Number(sh.profit.toFixed(2)),
    }));

    const axisStyle = { fontSize: 10, fill: 'var(--muted-foreground)' };

    return (
        <div className="flex flex-col gap-8">
            {/* Page header */}
            <PageHeader
                title="Dashboard"
                description="Organization-wide performance overview"
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
                            <ToggleGroupItem value="custom" className={cn(customDates && 'bg-primary text-primary-foreground hover:bg-primary/90')}>
                                Custom
                            </ToggleGroupItem>
                        </ToggleGroup>
                        {customDates !== null && (
                            <DatePicker.RangePicker
                                value={customDates}
                                onChange={(dates) => {
                                    if (dates?.[0] && dates?.[1]) {
                                        setCustomDates([dates[0], dates[1]]);
                                    } else {
                                        setCustomDates(null);
                                    }
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
                                onClick={() => {
                                    const end = dayjs();
                                    const start = dayjs().subtract(range, 'day');
                                    setCustomDates([start, end]);
                                }}
                            >
                                Custom…
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => customDates ? load(0, customDates) : load(range)}
                            aria-label="Refresh dashboard"
                        >
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                    </div>
                }
            />

            {/* ── Financial KPIs ─────────────────────────────────────────── */}
            <div>
                <p className="text-overline text-muted-foreground mb-3">Financial</p>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard
                        label="Total Revenue"
                        value={s ? fmtShort(s.total_revenue) : fmt(0)}
                        sub={s ? fmt(s.total_revenue) : undefined}
                        icon={DollarSign}
                        trend={{ direction: 'up', label: `${range}d period` }}
                        loading={loading}
                    />
                    <StatCard
                        label="Gross Profit"
                        value={s ? fmtShort(s.gross_profit) : fmt(0)}
                        sub={s ? `Margin ${profitMargin.toFixed(1)}%` : undefined}
                        icon={TrendingUp}
                        trend={{ direction: profitMargin > 20 ? 'up' : 'neutral', label: `${profitMargin.toFixed(1)}% margin` }}
                        loading={loading}
                    />
                    <StatCard
                        label="Total Orders"
                        value={s ? s.total_orders.toLocaleString() : '0'}
                        sub={s ? `${fmt(s.total_discounts)} discounts` : undefined}
                        icon={ShoppingCart}
                        trend={{ direction: 'neutral', label: 'paid orders' }}
                        loading={loading}
                    />
                    <StatCard
                        label="Avg Order Value"
                        value={s && s.total_orders > 0 ? fmtShort(avgOrderValue) : fmt(0)}
                        sub={s ? `Tax: ${fmtShort(s.total_tax)}` : undefined}
                        icon={Percent}
                        trend={{ direction: 'neutral', label: 'per transaction' }}
                        loading={loading}
                    />
                </div>
            </div>

            {/* ── Inventory KPIs ─────────────────────────────────────────── */}
            <div>
                <p className="text-overline text-muted-foreground mb-3">Inventory</p>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard
                        label="Total Items"
                        value={invStats ? invStats.total_items.toLocaleString() : '0'}
                        icon={Package}
                        trend={{ direction: 'neutral', label: 'in catalogue' }}
                        loading={loading}
                    />
                    <StatCard
                        label="Inventory Value"
                        value={invStats ? fmtShort(invStats.total_inventory_value) : fmt(0)}
                        sub={invStats ? fmt(invStats.total_inventory_value) : undefined}
                        icon={DollarSign}
                        trend={{ direction: 'neutral', label: 'at cost price' }}
                        loading={loading}
                    />
                    <StatCard
                        label="Low Stock"
                        value={invStats ? invStats.low_stock_items.toLocaleString() : '0'}
                        sub={invStats ? `${invStats.needs_reorder_items} need reorder` : undefined}
                        icon={AlertTriangle}
                        trend={{
                            direction: (invStats?.low_stock_items ?? 0) > 0 ? 'down' : 'up',
                            label: (invStats?.low_stock_items ?? 0) > 0 ? 'action required' : 'healthy',
                        }}
                        loading={loading}
                    />
                    <StatCard
                        label="Out of Stock"
                        value={invStats ? invStats.out_of_stock_items.toLocaleString() : '0'}
                        icon={XCircle}
                        trend={{
                            direction: (invStats?.out_of_stock_items ?? 0) > 0 ? 'down' : 'up',
                            label: (invStats?.out_of_stock_items ?? 0) > 0 ? 'critical' : 'all stocked',
                        }}
                        loading={loading}
                    />
                </div>
            </div>

            {/* ── Revenue trend area chart ────────────────────────────────── */}
            <ChartCard
                title="Revenue Trend"
                subtitle={`Daily revenue over the last ${range} days`}
                loading={loading}
                empty={!loading && visibleTrend.length === 0}
            >
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibleTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={CHART_PRIMARY} stopOpacity={0.18} />
                                    <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis
                                tick={axisStyle}
                                axisLine={false}
                                tickLine={false}
                                width={52}
                                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke={CHART_PRIMARY}
                                strokeWidth={2}
                                fill="url(#revenueGrad)"
                                dot={false}
                                activeDot={{ r: 4, fill: CHART_PRIMARY, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* ── Orders bar + shop pie ───────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <ChartCard
                    title="Daily Orders"
                    subtitle="Orders processed per day"
                    loading={loading}
                    empty={!loading && visibleTrend.length === 0}
                    className="xl:col-span-3"
                >
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={visibleTrend}
                                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                                barSize={range <= 14 ? 20 : range <= 30 ? 10 : 6}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="orders" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Revenue by Shop"
                    subtitle="Distribution across locations"
                    loading={loading}
                    empty={!loading && shopData.length === 0}
                    className="xl:col-span-2"
                >
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={shopData}
                                    cx="50%" cy="50%"
                                    innerRadius={52} outerRadius={82}
                                    paddingAngle={3}
                                    dataKey="revenue"
                                    nameKey="name"
                                >
                                    {shopData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: unknown) => [fmt(Number(v ?? 0)), 'Revenue']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={value => (
                                        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* ── Shop performance table ──────────────────────────────────── */}
            {!loading && shopData.length > 0 && (
                <Card className="gap-0 overflow-hidden">
                    <CardHeader className="border-border border-b px-6 py-4">
                        <CardTitle className="text-sm font-semibold">Shop Performance</CardTitle>
                        <CardDescription className="text-xs">Revenue, orders and profit by location</CardDescription>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <div className="flex items-center gap-1.5">
                                            <Store className="size-3.5" /> Shop
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shopData.map((shop, i) => {
                                    const margin = shop.revenue > 0 ? (shop.profit / shop.revenue) * 100 : 0;
                                    const share  = (finance?.summary.total_revenue ?? 0) > 0
                                        ? (shop.revenue / (finance?.summary.total_revenue ?? 1)) * 100
                                        : 0;
                                    return (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="size-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                                    />
                                                    <span className="text-foreground font-semibold">{shop.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <p className="text-success num-tabular font-semibold">{fmt(shop.revenue)}</p>
                                                <p className="text-muted-foreground text-[10px]">{share.toFixed(1)}% of total</p>
                                            </TableCell>
                                            <TableCell className="text-right num-tabular font-medium">
                                                {shop.orders.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right num-tabular font-semibold text-info">
                                                {fmt(shop.profit)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'rounded-full text-xs font-semibold',
                                                        margin >= 30 ? 'border-success/30 bg-success-muted text-success'
                                                            : margin >= 15 ? 'border-info/30 bg-info/10 text-info'
                                                                : 'border-warning/30 bg-warning/10 text-warning',
                                                    )}
                                                >
                                                    {margin.toFixed(1)}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href="/finance"
                                                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium"
                                                >
                                                    Details <ArrowUpRight className="size-3" />
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            {s && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-bold">Total</TableCell>
                                        <TableCell className="text-right num-tabular font-bold text-success">
                                            {fmt(s.total_revenue)}
                                        </TableCell>
                                        <TableCell className="text-right num-tabular font-bold">
                                            {s.total_orders.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right num-tabular font-bold text-info">
                                            {fmt(s.gross_profit)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="rounded-full text-xs font-semibold border-primary/30 bg-primary/10 text-primary">
                                                {profitMargin.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>
                </Card>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!loading && !finance && (
                <Card className="py-16">
                    <CardContent className="flex flex-col items-center gap-3 text-center">
                        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                            <Activity className="text-muted-foreground size-7" />
                        </div>
                        <div>
                            <p className="text-foreground font-medium">No financial data yet</p>
                            <p className="text-muted-foreground text-sm mt-1">Data will appear once orders are processed</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
