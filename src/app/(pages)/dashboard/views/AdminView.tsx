"use client"

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GetFinanceOverview } from '@/(api-handlers)/financeHandler';
import { GetInventoryStatistics } from '@/(api-handlers)/inventoryHandler';
import { FinanceOverviewResponse } from '@/interfaces/finance';
import { InventoryStats } from '@/interfaces/inventory';
import {
    TrendingUp, TrendingDown, ShoppingCart, DollarSign,
    Package, AlertTriangle, XCircle, RefreshCcw,
    Store, ArrowUpRight, Activity, Percent
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
    label, value, sub, icon, trend, trendLabel, colorClass = 'text-slate-900', loading
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    colorClass?: string;
    loading?: boolean;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <div className="size-9 rounded-xl flex items-center justify-center bg-slate-50">
                    {icon}
                </div>
            </div>
            <div>
                <p className={cn('text-2xl font-bold tracking-tight', colorClass)}>
                    {loading ? (
                        <span className="inline-block w-24 h-7 bg-slate-100 rounded animate-pulse" />
                    ) : value}
                </p>
                {sub && (
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                )}
            </div>
            {trendLabel && (
                <div className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-slate-500'
                )}>
                    {trend === 'up' && <TrendingUp className="size-3.5" />}
                    {trend === 'down' && <TrendingDown className="size-3.5" />}
                    {trend === 'neutral' && <Activity className="size-3.5" />}
                    <span>{trendLabel}</span>
                </div>
            )}
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
            <p className="font-semibold text-slate-700 mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex justify-between gap-4">
                    <span className="text-slate-500 capitalize">{p.name}</span>
                    <span className="font-semibold text-slate-900">
                        {p.name === 'revenue' ? `GHS ${p.value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export const AdminView = () => {
    const [finance, setFinance] = useState<FinanceOverviewResponse | null>(null);
    const [invStats, setInvStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState(30);

    const load = useCallback(async (days: number) => {
        setLoading(true);
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - days);
            const fmt = (d: Date) => d.toISOString().split('T')[0];

            const [fin, inv] = await Promise.all([
                GetFinanceOverview(undefined, fmt(start), fmt(end)),
                GetInventoryStatistics(),
            ]);
            setFinance(fin);
            setInvStats(inv);
        } catch {
            // silently fail — dashboard is informational
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(range); }, [load, range]);

    const handleRange = (days: number) => {
        setRange(days);
    };

    // Derived data
    const s = finance?.summary;
    const avgOrderValue = s && s.total_orders > 0 ? s.total_revenue / s.total_orders : 0;
    const profitMargin = s && s.total_revenue > 0 ? (s.gross_profit / s.total_revenue) * 100 : 0;

    const fmt = (n: number) => `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtShort = (n: number) => {
        if (n >= 1_000_000) return `GHS ${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `GHS ${(n / 1_000).toFixed(1)}K`;
        return fmt(n);
    };

    // Chart data: thin out dates for readability
    const trendData = (finance?.trends ?? []).map((t) => ({
        date: new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: Number(t.revenue.toFixed(2)),
        orders: t.orders,
    }));

    // Sample every N points for 90d to avoid overcrowding
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

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Organization Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Real-time performance overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
                        {RANGES.map(r => (
                            <button
                                key={r.days}
                                onClick={() => handleRange(r.days)}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                    range === r.days
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => load(range)}
                        className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* KPI Row 1 — Financial */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Revenue"
                    value={s ? fmtShort(s.total_revenue) : 'GHS 0'}
                    sub={s ? fmt(s.total_revenue) : undefined}
                    icon={<DollarSign className="size-4 text-emerald-600" />}
                    colorClass="text-emerald-700"
                    trend="up"
                    trendLabel={`${range}d period`}
                    loading={loading}
                />
                <KpiCard
                    label="Gross Profit"
                    value={s ? fmtShort(s.gross_profit) : 'GHS 0'}
                    sub={s ? `Margin: ${profitMargin.toFixed(1)}%` : undefined}
                    icon={<TrendingUp className="size-4 text-blue-600" />}
                    colorClass="text-blue-700"
                    trend={profitMargin > 20 ? 'up' : 'neutral'}
                    trendLabel={`${profitMargin.toFixed(1)}% margin`}
                    loading={loading}
                />
                <KpiCard
                    label="Total Orders"
                    value={s ? s.total_orders.toLocaleString() : '0'}
                    sub={s ? `GHS ${s.total_discounts.toFixed(2)} discounts` : undefined}
                    icon={<ShoppingCart className="size-4 text-violet-600" />}
                    colorClass="text-violet-700"
                    trend="neutral"
                    trendLabel="paid orders"
                    loading={loading}
                />
                <KpiCard
                    label="Avg Order Value"
                    value={s && s.total_orders > 0 ? fmtShort(avgOrderValue) : 'GHS 0'}
                    sub={s ? `Tax collected: ${fmtShort(s.total_tax)}` : undefined}
                    icon={<Percent className="size-4 text-amber-600" />}
                    colorClass="text-amber-700"
                    trend="neutral"
                    trendLabel="per transaction"
                    loading={loading}
                />
            </div>

            {/* KPI Row 2 — Inventory */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Items"
                    value={invStats ? invStats.total_items.toLocaleString() : '0'}
                    icon={<Package className="size-4 text-slate-600" />}
                    trend="neutral"
                    trendLabel="in catalogue"
                    loading={loading}
                />
                <KpiCard
                    label="Inventory Value"
                    value={invStats ? fmtShort(invStats.total_inventory_value) : 'GHS 0'}
                    sub={invStats ? fmt(invStats.total_inventory_value) : undefined}
                    icon={<DollarSign className="size-4 text-teal-600" />}
                    colorClass="text-teal-700"
                    trend="neutral"
                    trendLabel="at cost price"
                    loading={loading}
                />
                <KpiCard
                    label="Low Stock Items"
                    value={invStats ? invStats.low_stock_items.toLocaleString() : '0'}
                    sub={invStats ? `${invStats.needs_reorder_items} need reorder` : undefined}
                    icon={<AlertTriangle className="size-4 text-amber-500" />}
                    colorClass={(invStats?.low_stock_items ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'}
                    trend={(invStats?.low_stock_items ?? 0) > 0 ? 'down' : 'up'}
                    trendLabel={(invStats?.low_stock_items ?? 0) > 0 ? 'action required' : 'healthy'}
                    loading={loading}
                />
                <KpiCard
                    label="Out of Stock"
                    value={invStats ? invStats.out_of_stock_items.toLocaleString() : '0'}
                    icon={<XCircle className="size-4 text-rose-500" />}
                    colorClass={(invStats?.out_of_stock_items ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'}
                    trend={(invStats?.out_of_stock_items ?? 0) > 0 ? 'down' : 'up'}
                    trendLabel={(invStats?.out_of_stock_items ?? 0) > 0 ? 'critical' : 'all stocked'}
                    loading={loading}
                />
            </div>

            {/* Revenue Trend — Area Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <SectionHeader
                    title="Revenue Trend"
                    subtitle={`Daily revenue over the last ${range} days`}
                />
                {loading ? (
                    <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
                ) : visibleTrend.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data for selected period</div>
                ) : (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visibleTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                                    width={50}
                                />
                                <Tooltip content={<RevenueTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    fill="url(#revenueGradient)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Orders Bar + Shop Pie */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Orders Bar Chart */}
                <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <SectionHeader
                        title="Daily Orders"
                        subtitle="Number of orders processed per day"
                    />
                    {loading ? (
                        <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
                    ) : visibleTrend.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>
                    ) : (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={visibleTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={range <= 14 ? 20 : range <= 30 ? 10 : 6}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        width={30}
                                    />
                                    <Tooltip
                                        content={<RevenueTooltip />}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Shop Revenue Pie */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <SectionHeader
                        title="Revenue by Shop"
                        subtitle="Distribution across locations"
                    />
                    {loading ? (
                        <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
                    ) : shopData.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No shop data</div>
                    ) : (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={shopData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
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
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Shop Performance Table */}
            {!loading && shopData.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-slate-50">
                        <SectionHeader
                            title="Shop Performance"
                            subtitle="Revenue, orders and profit by location"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/80">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5"><Store className="size-3.5" /> Shop</div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Profit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Margin</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shopData.map((shop, i) => {
                                    const margin = shop.revenue > 0 ? (shop.profit / shop.revenue) * 100 : 0;
                                    const revenueShare = (finance?.summary.total_revenue ?? 0) > 0
                                        ? (shop.revenue / (finance?.summary.total_revenue ?? 1)) * 100
                                        : 0;
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="size-2.5 rounded-full"
                                                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                                    />
                                                    <span className="font-semibold text-slate-800">{shop.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div>
                                                    <p className="font-semibold text-emerald-700">{fmt(shop.revenue)}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{revenueShare.toFixed(1)}% of total</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-700 font-medium">{shop.orders.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-blue-700">{fmt(shop.profit)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-xs font-semibold rounded-full',
                                                        margin >= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : margin >= 15 ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    )}
                                                >
                                                    {margin.toFixed(1)}%
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a href="/finance" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                                    Details <ArrowUpRight className="size-3" />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals row */}
                            {s && (
                                <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                                        <td className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Total</td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-700">{fmt(s.total_revenue)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-700">{s.total_orders.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right font-bold text-blue-700">{fmt(s.gross_profit)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <Badge variant="outline" className="text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border-indigo-200">
                                                {profitMargin.toFixed(1)}%
                                            </Badge>
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state when no data at all */}
            {!loading && !finance && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <Activity className="size-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No financial data available yet</p>
                    <p className="text-slate-400 text-xs mt-1">Data will appear once orders are processed</p>
                </div>
            )}
        </div>
    );
};
