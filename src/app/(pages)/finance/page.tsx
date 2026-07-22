"use client";

import { useEffect, useState, useCallback } from "react";
import {
    TrendingUp, TrendingDown, DollarSign,
    Calendar, RefreshCcw, Store, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { GetFinanceOverview } from "@/(api-handlers)/financeHandler";
import { getOrganizationShops } from "@/(api-handlers)/organizationShopsHandler";
import { FinanceOverviewResponse, ShopFinance, RevenueTrend } from "@/interfaces/finance";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { toast } from "sonner";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { useCurrency } from "@/hooks/useCurrency";
import PageHeader from "@/components/(shared-components)/PageHeader";
import StatsGrid from "@/components/(shared-components)/StatsGrid";
import { cn } from "@/lib/utils";

function toISODate(d: Date) {
    return d.toISOString().split('T')[0];
}

function ProgressBar({ percent, status }: { percent: number; status: 'success' | 'warning' | 'danger' }) {
    const color =
        status === 'success' ? 'bg-success' :
        status === 'warning' ? 'bg-warning' :
        'bg-destructive';
    return (
        <div className="bg-muted h-1.5 w-full max-w-[100px] rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
    );
}

export default function FinancePage() {
    const fmt = useCurrency();
    const { user } = useAuthStore();
    const role = (user?.role || "attendant").toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const [financeData, setFinanceData] = useState<FinanceOverviewResponse | null>(null);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState<string>("all");

    const defaultStart = toISODate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const defaultEnd = toISODate(new Date());
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [financeOverview, shopsData] = await Promise.all([
                GetFinanceOverview(
                    selectedShop === "all" ? undefined : Number(selectedShop),
                    startDate,
                    endDate,
                ),
                getOrganizationShops(),
            ]);
            setFinanceData(financeOverview);
            setShops(shopsData);
        } catch (error) {
            console.error("Failed to fetch financial data:", error);
            toast.error("Failed to load financial records");
        } finally {
            setLoading(false);
        }
    }, [selectedShop, startDate, endDate]);

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [fetchData, isAdmin]);

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
                    <p className="text-destructive text-lg font-bold">Access Restricted</p>
                    <p className="text-muted-foreground mt-1 text-sm">This page is strictly for administrators only.</p>
                </div>
            </div>
        );
    }

    const statsConfig = financeData ? [
        {
            name: 'Total Revenue',
            value: fmt(financeData.summary.total_revenue),
            change: `${financeData.summary.total_orders} Orders`,
            changeType: 'neutral' as const,
        },
        {
            name: 'Estimated Profit',
            value: fmt(financeData.summary.net_profit),
            change: `${Math.round(financeData.summary.total_revenue > 0 ? (financeData.summary.net_profit / financeData.summary.total_revenue) * 100 : 0)}% Margin`,
            changeType: 'positive' as const,
        },
        {
            name: 'Cost of Goods',
            value: fmt(financeData.summary.total_cost),
            change: 'Inventory Value',
            changeType: 'neutral' as const,
        },
        {
            name: 'Tax Collected',
            value: fmt(financeData.summary.total_tax),
            change: 'Government Dues',
            changeType: 'neutral' as const,
        },
    ] : [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Financial Analytics"
                description="Real-time revenue, profit tracking, and multi-shop performance analysis."
                actions={
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        <RefreshCcw className={cn("mr-2 size-4", loading && "animate-spin")} />
                        Sync Data
                    </Button>
                }
            />

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <Calendar className="size-3.5" /> From
                            </Label>
                            <DatePicker
                                value={startDate ? dayjs(startDate) : null}
                                onChange={(date) => setStartDate(date ? date.format('YYYY-MM-DD') : '')}
                                format="DD MMM YYYY"
                                className="h-9 w-40"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <Calendar className="size-3.5" /> To
                            </Label>
                            <DatePicker
                                value={endDate ? dayjs(endDate) : null}
                                onChange={(date) => setEndDate(date ? date.format('YYYY-MM-DD') : '')}
                                format="DD MMM YYYY"
                                className="h-9 w-40"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <Store className="size-3.5" /> Shop
                            </Label>
                            <Select value={selectedShop} onValueChange={setSelectedShop}>
                                <SelectTrigger className="h-9 w-52">
                                    <SelectValue placeholder="All Shops" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Shops Combined</SelectItem>
                                    {shops.map(shop => (
                                        <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="ml-auto hidden lg:flex items-center">
                            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                                Live Updates
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading state */}
            {loading && !financeData ? (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-border overflow-hidden rounded-2xl border">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-none" />)}
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-48 rounded-2xl" />
                </div>
            ) : !financeData ? (
                <div className="flex flex-col gap-6 items-center py-20">
                    <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                        <BarChart3 className="text-muted-foreground size-7" />
                    </div>
                    <p className="text-foreground font-semibold">No financial data available</p>
                    <p className="text-muted-foreground text-sm">Try adjusting the date range or shop filter.</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <StatsGrid
                        stats={statsConfig.map(stat => ({ ...stat, value: loading ? '…' : stat.value }))}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main tables */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shop Breakdown */}
                            <Card className="gap-0 overflow-hidden p-0">
                                <CardHeader className="border-b px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Performance by Shop</CardTitle>
                                            <p className="text-muted-foreground text-xs mt-0.5">Revenue and profit across your locations</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {financeData.shop_breakdown.length} Shops
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="pl-6">Shop</TableHead>
                                                <TableHead>Orders</TableHead>
                                                <TableHead>Revenue</TableHead>
                                                <TableHead>Profit</TableHead>
                                                <TableHead className="pr-6">Margin</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {financeData.shop_breakdown.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                        No shop data for this period.
                                                    </TableCell>
                                                </TableRow>
                                            ) : financeData.shop_breakdown.map((shop: ShopFinance) => {
                                                const margin = shop.revenue > 0 ? (shop.profit / shop.revenue) * 100 : 0;
                                                return (
                                                    <TableRow key={shop.shop_id}>
                                                        <TableCell className="pl-6">
                                                            <div className="flex items-center gap-2">
                                                                <Store className="text-muted-foreground size-4" />
                                                                <span className="text-foreground font-medium">{shop.shop_name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-foreground font-semibold">{shop.orders_count}</TableCell>
                                                        <TableCell className="font-medium">{fmt(shop.revenue)}</TableCell>
                                                        <TableCell className={cn("font-semibold", shop.profit >= 0 ? "text-success" : "text-destructive")}>
                                                            {fmt(shop.profit)}
                                                        </TableCell>
                                                        <TableCell className="pr-6">
                                                            <div className="flex items-center gap-2">
                                                                <ProgressBar
                                                                    percent={Math.round(margin)}
                                                                    status={margin >= 20 ? 'success' : margin >= 10 ? 'warning' : 'danger'}
                                                                />
                                                                <span className="text-muted-foreground text-xs">{Math.round(margin)}%</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            {/* Daily Revenue Trends */}
                            <Card className="gap-0 overflow-hidden p-0">
                                <CardHeader className="border-b px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <BarChart3 className="text-primary size-5" />
                                        Daily Revenue Trends
                                    </CardTitle>
                                    <p className="text-muted-foreground text-xs mt-0.5">Daily summary of sales and volume</p>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="pl-6">Date</TableHead>
                                                <TableHead className="text-center">Orders</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="pr-6 text-right">Daily Change</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {financeData.trends.slice().reverse().slice(0, 14).map((t: RevenueTrend, idx, arr) => {
                                                const prev = arr[idx + 1]?.revenue;
                                                const diff = prev && prev > 0 ? ((t.revenue - prev) / prev) * 100 : null;
                                                return (
                                                    <TableRow key={t.date}>
                                                        <TableCell className="pl-6 text-sm font-medium">
                                                            {new Date(t.date).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell className="text-center font-semibold">{t.orders}</TableCell>
                                                        <TableCell className="text-foreground text-right font-bold">{fmt(t.revenue)}</TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            {diff !== null ? (
                                                                <div className={cn("flex items-center justify-end gap-1 text-xs font-bold", diff >= 0 ? "text-success" : "text-destructive")}>
                                                                    {diff >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                                                    {Math.abs(diff).toFixed(1)}%
                                                                </div>
                                                            ) : <span className="text-muted-foreground text-xs">—</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Insight card */}
                            <Card
                                className="text-primary-foreground overflow-hidden relative border-0"
                                style={{ background: 'linear-gradient(135deg, #a47451 0.000%, #9c9881 16.667%, #73a09d 33.333%, #3b899a 50.000%, #095b79 66.667%, #002847 83.333%, #000116 100.000%)' }}
                            >
                                <div className="absolute -bottom-6 -right-6 size-32 rounded-full bg-white/10 blur-2xl" />
                                <CardHeader>
                                    <CardTitle className="text-primary-foreground text-base">Financial Insight</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                        Average order value:{' '}
                                        <span className="text-primary-foreground font-bold">
                                            {fmt(financeData.summary.total_orders > 0
                                                ? financeData.summary.total_revenue / financeData.summary.total_orders
                                                : 0)}
                                        </span>.
                                        Most profitable shop:{' '}
                                        <span className="text-primary-foreground font-bold">
                                            {financeData.shop_breakdown.length > 0
                                                ? [...financeData.shop_breakdown].sort((a, b) => b.profit - a.profit)[0].shop_name
                                                : 'N/A'}
                                        </span>.
                                    </p>

                                    <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                                        <div className="mb-1 flex justify-between text-xs opacity-70">
                                            <span>Revenue Progress</span>
                                            <span>{Math.min(100, Math.round((financeData.summary.total_revenue / 1_000_000) * 100))}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-white transition-all"
                                                style={{ width: `${Math.min(100, Math.round((financeData.summary.total_revenue / 1_000_000) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-sm font-bold">Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {financeData.trends.slice(-5).reverse().map((t, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex size-8 items-center justify-center rounded-full",
                                                t.revenue > 0 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                                            )}>
                                                <DollarSign className="size-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-foreground text-xs font-semibold">
                                                    {new Date(t.date).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-muted-foreground text-[10px]">{t.orders} Orders</p>
                                            </div>
                                            <p className="text-foreground text-xs font-bold">{fmt(t.revenue)}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
