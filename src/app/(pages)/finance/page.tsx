/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Briefcase,
    Calendar,
    Filter,
    RefreshCcw,
    ArrowUpRight,
    ArrowDownRight,
    Store,
    PieChart,
    BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DatePicker,
    Table,
    Row,
    Col,
    Statistic,
    Progress,
    Empty,
    Spin,
    Typography,
    Space,
    Divider
} from "antd";
import type { ColumnsType } from 'antd/es/table';
import { GetFinanceOverview } from "@/(api-handlers)/financeHandler";
import { getOrganizationShops } from "@/(api-handlers)/organizationShopsHandler";
import { FinanceOverviewResponse, ShopFinance, RevenueTrend } from "@/interfaces/finance";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/(zustand-store)/authStore";
import PageHeader from "@/components/(shared-components)/PageHeader";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function FinancePage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    const [financeData, setFinanceData] = useState<FinanceOverviewResponse | null>(null);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState<string>("all");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().subtract(30, 'day'),
        dayjs()
    ]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [financeOverview, shopsData] = await Promise.all([
                GetFinanceOverview(
                    selectedShop === "all" ? undefined : Number(selectedShop),
                    dateRange[0].format('YYYY-MM-DD'),
                    dateRange[1].format('YYYY-MM-DD')
                ),
                getOrganizationShops()
            ]);
            setFinanceData(financeOverview);
            setShops(shopsData);
        } catch (error) {
            console.error("Failed to fetch financial data:", error);
            toast.error("Failed to load financial records");
        } finally {
            setLoading(false);
        }
    }, [selectedShop, dateRange]);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [fetchData, isAdmin]);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <Title level={4} className="text-rose-600 m-0">Access Restricted</Title>
                    <Text className="text-rose-500">This page is strictly for administrators only.</Text>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
        }).format(amount);
    };

    const shopColumns: ColumnsType<ShopFinance> = [
        {
            title: 'Shop Name',
            dataIndex: 'shop_name',
            key: 'shop_name',
            render: (text) => (
                <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-700">{text}</span>
                </div>
            ),
        },
        {
            title: 'Orders',
            dataIndex: 'orders_count',
            key: 'orders_count',
            sorter: (a, b) => a.orders_count - b.orders_count,
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (val) => <span className="font-medium">{formatCurrency(val)}</span>,
            sorter: (a, b) => a.revenue - b.revenue,
        },
        {
            title: 'Estimated Profit',
            dataIndex: 'profit',
            key: 'profit',
            render: (val) => (
                <span className={`font-semibold ${val >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(val)}
                </span>
            ),
            sorter: (a, b) => a.profit - b.profit,
        },
        {
            title: 'Profit Margin',
            key: 'margin',
            render: (_, record) => {
                const margin = record.revenue > 0 ? (record.profit / record.revenue) * 100 : 0;
                return (
                    <div className="flex items-center gap-3 w-full max-w-[120px]">
                        <Progress
                            percent={Math.round(margin)}
                            size="small"
                            status={margin >= 20 ? "success" : margin >= 10 ? "normal" : "exception"}
                        />
                    </div>
                );
            }
        }
    ];

    const trendColumns: ColumnsType<RevenueTrend> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('MMM DD, YYYY'),
        },
        {
            title: 'Orders',
            dataIndex: 'orders',
            key: 'orders',
            align: 'center',
            render: (val) => <span className="font-semibold">{val}</span>
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right',
            render: (val) => <span className="font-bold text-slate-900">{formatCurrency(val)}</span>,
        },
        {
            title: 'Daily Performance',
            key: 'performance',
            align: 'right',
            render: (_, record, index) => {
                if (index === 0 || !financeData) return null;
                const prev = financeData.trends[index - 1].revenue;
                const current = record.revenue;
                const diff = prev > 0 ? ((current - prev) / prev) * 100 : 0;

                return (
                    <div className={`flex items-center justify-end gap-1 text-xs font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(diff).toFixed(1)}%
                    </div>
                );
            }
        }
    ];

    const statsConfig = financeData ? [
        {
            name: 'Total Revenue',
            value: formatCurrency(financeData.summary.total_revenue),
            change: `${financeData.summary.total_orders} Orders`,
            changeType: 'neutral',
            icon: <DollarSign className="size-5 text-blue-600" />
        },
        {
            name: 'Estimated Profit',
            value: formatCurrency(financeData.summary.net_profit),
            change: `${Math.round((financeData.summary.net_profit / financeData.summary.total_revenue) * 100)}% Margin`,
            changeType: 'positive',
            icon: <Briefcase className="size-5 text-emerald-600" />
        },
        {
            name: 'Cost of Goods',
            value: formatCurrency(financeData.summary.total_cost),
            change: 'Inventory Value',
            changeType: 'neutral',
            icon: <ShoppingCart className="size-5 text-purple-600" />
        },
        {
            name: 'Tax Collected',
            value: formatCurrency(financeData.summary.total_tax),
            change: 'Government Dues',
            changeType: 'neutral',
            icon: <PieChart className="size-5 text-amber-500" />
        },
    ] : [];

    return (
        <div className="p-6 space-y-8 bg-linear-to-br from-slate-50 via-white to-slate-50 min-h-screen">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <PageHeader
                    title="Financial Analytics"
                    description="Real-time revenue, profit tracking, and multi-shop performance analysis."
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={fetchData}
                            disabled={loading}
                            className="rounded-xl h-10 border-slate-200 hover:border-slate-300 bg-white"
                        >
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Sync Data
                        </Button>
                    </div>
                </PageHeader>
            </motion.div>

            {/* Filters Bar */}
            <Card className="p-4 border-slate-100 shadow-sm bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
                            className="h-10 rounded-lg border-slate-200"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-[240px]">
                        <Store className="h-4 w-4 text-slate-400" />
                        <Select value={selectedShop} onValueChange={setSelectedShop}>
                            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg">
                                <SelectValue placeholder="All Shops" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Shops Combined</SelectItem>
                                {shops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="ml-auto hidden lg:flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
                            Live Updates
                        </Badge>
                    </div>
                </div>
            </Card>

            {loading && !financeData ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                    <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-slate-500 font-medium">Calculating financial metrics...</p>
                </div>
            ) : financeData ? (
                <>
                    {/* Stats Grid */}
                    <motion.dl
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mx-auto grid grid-cols-1 gap-px bg-slate-200 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2 lg:grid-cols-4 shadow-sm w-full"
                    >
                        {statsConfig.map((stat) => (
                            <div
                                key={stat.name}
                                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-8 sm:px-6 xl:px-8"
                            >
                                <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    {stat.icon}
                                    {stat.name}
                                </dt>
                                <dd
                                    className={cn(
                                        'text-xs font-semibold',
                                        stat.changeType === 'negative' ? 'text-rose-600' :
                                            stat.changeType === 'positive' ? 'text-emerald-600' : 'text-slate-500'
                                    )}
                                >
                                    {stat.change}
                                </dd>
                                <dd className="w-full flex-none text-3xl font-bold tracking-tight text-slate-900 mt-2">
                                    {loading ? '...' : stat.value}
                                </dd>
                            </div>
                        ))}
                    </motion.dl>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Shop Breakdown */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl bg-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Title level={4} className="m-0">Performance by Shop</Title>
                                        <Text type="secondary" className="text-xs">Comparison of revenue and profit across your locations.</Text>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-600 border-none font-medium">
                                        {financeData.shop_breakdown.length} Shops Found
                                    </Badge>
                                </div>
                                <Table
                                    columns={shopColumns}
                                    dataSource={financeData.shop_breakdown}
                                    rowKey="shop_id"
                                    pagination={false}
                                    className="ant-table-custom"
                                />
                            </Card>

                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl bg-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Title level={4} className="m-0 flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            Daily Revenue Trends
                                        </Title>
                                        <Text type="secondary" className="text-xs">Daily summary of sales and volume.</Text>
                                    </div>
                                </div>
                                <Table
                                    columns={trendColumns}
                                    dataSource={financeData.trends.slice().reverse()}
                                    rowKey="date"
                                    pagination={{ pageSize: 7 }}
                                    className="ant-table-custom"
                                />
                            </Card>
                        </div>

                        {/* Summary & Insights Sidebar */}
                        <div className="space-y-6">
                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl bg-primary text-white overflow-hidden relative">
                                <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
                                <Title level={4} className="m-0 text-white! mb-4">Financial Insight</Title>
                                <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
                                    Your average order value in this period is
                                    <span className="text-white font-bold ml-1">
                                        {formatCurrency(financeData.summary.total_orders > 0 ? financeData.summary.total_revenue / financeData.summary.total_orders : 0)}
                                    </span>.
                                    The most profitable shop is <span className="text-white font-bold">
                                        {financeData.shop_breakdown.length > 0 ?
                                            financeData.shop_breakdown.sort((a, b) => b.profit - a.profit)[0].shop_name : 'N/A'
                                        }
                                    </span>.
                                </p>
                                <div className="space-y-4">
                                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                        <div className="flex justify-between items-center text-xs opacity-70 mb-1">
                                            <span>Revenue Target</span>
                                            <span>{Math.round((financeData.summary.total_revenue / 1000000) * 100)}%</span>
                                        </div>
                                        <Progress
                                            percent={Math.round((financeData.summary.total_revenue / 1000000) * 100)}
                                            size="small"
                                            showInfo={false}
                                            strokeColor="#fff"
                                            trailColor="rgba(255,255,255,0.1)"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl bg-white">
                                <Title level={5} className="mb-4">Recent Activity</Title>
                                <div className="space-y-4">
                                    {financeData.trends.slice(-5).reverse().map((t, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.revenue > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-semibold text-slate-700">{dayjs(t.date).format('ddd, MMM DD')}</div>
                                                <div className="text-[10px] text-slate-400">{t.orders} Successful Orders</div>
                                            </div>
                                            <div className="text-xs font-bold text-slate-900">{formatCurrency(t.revenue)}</div>
                                        </div>
                                    ))}
                                </div>
                                <Divider className="my-6" />
                                <Button variant="ghost" className="w-full text-primary text-xs hover:bg-primary/5">
                                    View Detailed Reports
                                </Button>
                            </Card>
                        </div>
                    </div>
                </>
            ) : (
                <Empty description="No financial data available for the selected filters." />
            )}
        </div>
    );
}
