"use client"

import { useEffect, useState, useCallback } from 'react';
import { GetFinanceOverview } from '@/(api-handlers)/financeHandler';
import { GetInventoryStatistics } from '@/(api-handlers)/inventoryHandler';
import { FinanceOverviewResponse } from '@/interfaces/finance';
import { InventoryStats } from '@/interfaces/inventory';
import { TrendingUp, ShoppingCart, DollarSign, Package, AlertTriangle, XCircle, RefreshCcw, Store } from 'lucide-react';

function StatCard({ label, value, icon, color = 'text-slate-900' }: { label: string; value: string; icon?: React.ReactNode; color?: string }) {
    return (
        <div className="bg-slate-50 rounded-xl p-5 flex flex-col gap-2 border border-slate-100">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                {icon}
            </div>
            <span className={`text-2xl font-bold tracking-tight ${color}`}>{value}</span>
        </div>
    );
}

export const AdminView = () => {
    const [finance, setFinance] = useState<FinanceOverviewResponse | null>(null);
    const [invStats, setInvStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [fin, inv] = await Promise.all([
                GetFinanceOverview(),
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

    useEffect(() => { load(); }, [load]);

    const fmt = (n: number) => `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtN = (n: number) => n.toLocaleString();

    const summary = finance?.summary;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Organization Overview</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Last 30 days performance</p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                    <RefreshCcw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Finance Stats */}
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Financials</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Revenue"
                        value={loading ? '—' : fmt(summary?.total_revenue ?? 0)}
                        icon={<DollarSign className="size-4 text-emerald-500" />}
                        color="text-emerald-700"
                    />
                    <StatCard
                        label="Gross Profit"
                        value={loading ? '—' : fmt(summary?.gross_profit ?? 0)}
                        icon={<TrendingUp className="size-4 text-blue-500" />}
                        color="text-blue-700"
                    />
                    <StatCard
                        label="Total Orders"
                        value={loading ? '—' : fmtN(summary?.total_orders ?? 0)}
                        icon={<ShoppingCart className="size-4 text-purple-500" />}
                    />
                    <StatCard
                        label="Avg Order Value"
                        value={loading ? '—' : fmt(summary && summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0)}
                        icon={<DollarSign className="size-4 text-amber-500" />}
                        color="text-amber-700"
                    />
                </div>
            </div>

            {/* Inventory Stats */}
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Inventory</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Items"
                        value={loading ? '—' : fmtN(invStats?.total_items ?? 0)}
                        icon={<Package className="size-4 text-blue-500" />}
                    />
                    <StatCard
                        label="Low Stock"
                        value={loading ? '—' : fmtN(invStats?.low_stock_items ?? 0)}
                        icon={<AlertTriangle className="size-4 text-amber-500" />}
                        color={(invStats?.low_stock_items ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'}
                    />
                    <StatCard
                        label="Out of Stock"
                        value={loading ? '—' : fmtN(invStats?.out_of_stock_items ?? 0)}
                        icon={<XCircle className="size-4 text-rose-500" />}
                        color={(invStats?.out_of_stock_items ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'}
                    />
                </div>
            </div>

            {/* Revenue Trend */}
            {!loading && finance && finance.trends.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Revenue Trend (30 Days)</p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-end gap-1 h-24">
                            {(() => {
                                const max = Math.max(...finance.trends.map(t => t.revenue), 1);
                                return finance.trends.map((t, i) => (
                                    <div
                                        key={i}
                                        title={`${t.date}: ${fmt(t.revenue)}`}
                                        className="flex-1 bg-primary/70 hover:bg-primary rounded-sm transition-all cursor-default"
                                        style={{ height: `${Math.max((t.revenue / max) * 100, t.revenue > 0 ? 4 : 1)}%` }}
                                    />
                                ));
                            })()}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                            <span>{finance.trends[0]?.date}</span>
                            <span>{finance.trends[finance.trends.length - 1]?.date}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Shop Breakdown */}
            {!loading && finance && finance.shop_breakdown.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Shop Performance</p>
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        <div className="flex items-center gap-1.5"><Store className="size-3.5" /> Shop</div>
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                                    <th className="px-4 py-3 text-right font-medium">Orders</th>
                                    <th className="px-4 py-3 text-right font-medium">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {finance.shop_breakdown.map((shop) => (
                                    <tr key={shop.shop_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{shop.shop_name}</td>
                                        <td className="px-4 py-3 text-right text-emerald-700 font-semibold">{fmt(shop.revenue)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{fmtN(shop.orders_count)}</td>
                                        <td className="px-4 py-3 text-right text-blue-700 font-semibold">{fmt(shop.profit)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-8">
                    <RefreshCcw className="size-6 animate-spin text-slate-300" />
                </div>
            )}
        </div>
    );
};
