/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Calendar,
    ShoppingBag,
    CircleDollarSign,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    Filter,
    BarChart3,
    Package,
    CreditCard,
    Settings2
} from 'lucide-react';
import { DatePicker, Table, Card, Button, Input, Tag as AntTag } from 'antd';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { GetSoldItemsReport } from '@/(api-handlers)/orders_walkinsHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { SoldItem } from '@/interfaces/orders_walkins';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';


export default function SalesReportPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SoldItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('date_desc');
    
    // Shop filtering
    const { user } = useAuthStore();
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>('all');
    const role = (user?.role || "attendant").toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const fetchShops = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const data = await getOrganizationShops();
            setShops(data);
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = selectedDate.format('YYYY-MM-DD');
            const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const response = await GetSoldItemsReport(dateStr, currentPage, pageSize, shopIdParams);
            setData(response.items);
            setTotalCount(response.total_count);
            setTotalRevenue(response.total_revenue);
        } catch (error) {
            handleErrorMessage(error, 'Failed to load sales report');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, currentPage, pageSize, selectedShopId]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleDateChange = (date: any) => {
        if (date) {
            setSelectedDate(date);
            setCurrentPage(1);
        }
    };

    // Get unique categories for filter
    const categories = Array.from(new Set(data.map(item => item.category_name).filter((cat): cat is string => Boolean(cat))));

    const filteredData = data
        .filter(item =>
            (searchTerm === '' ||
                item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
            ) &&
            (categoryFilter === 'all' || item.category_name === categoryFilter)
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'date_desc':
                    return new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime();
                case 'date_asc':
                    return new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime();
                case 'amount_desc':
                    return b.total_amount - a.total_amount;
                case 'amount_asc':
                    return a.total_amount - b.total_amount;
                case 'qty_desc':
                    return b.quantity - a.quantity;
                default:
                    return 0;
            }
        });

    const columns: ColumnsType<SoldItem> = [
        {
            title: 'PRODUCT',
            key: 'product',
            width: '25%',
            render: (_, record) => (
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{record.product_name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {record.product_sku}</span>
                            <AntTag className="bg-slate-100 text-slate-600 border-0 text-[10px] px-2 py-0.5 rounded-full">
                                {record.category_name || 'General'}
                            </AntTag>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'ORDER',
            key: 'order',
            width: '15%',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-blue-600">#{record.order_number}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                        {format(new Date(record.sold_at), 'hh:mm a')}
                    </span>
                </div>
            ),
        },
        {
            title: 'QUANTITY',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '10%',
            align: 'center',
            render: (val) => (
                <div className="flex items-center justify-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-semibold text-slate-700">
                        x{val}
                    </span>
                </div>
            ),
        },
        {
            title: 'UNIT PRICE',
            dataIndex: 'unit_price',
            key: 'unit_price',
            width: '12%',
            align: 'right',
            render: (val) => (
                <span className="text-sm text-slate-600 font-mono">
                    ${val.toFixed(2)}
                </span>
            ),
        },
        {
            title: 'TOTAL',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: '15%',
            align: 'right',
            render: (val) => (
                <span className="text-lg font-bold text-slate-900 font-mono">
                    ${val.toFixed(2)}
                </span>
            ),
        },
        {
            title: 'STATUS',
            key: 'status',
            width: '10%',
            align: 'center',
            render: () => (
                <AntTag color="success" className="rounded-full px-3 py-0.5 text-xs">
                    Completed
                </AntTag>
            ),
        },
    ];

    const summaryCards = [
        {
            title: 'Total Revenue',
            value: totalRevenue,
            icon: CircleDollarSign,
            color: 'from-blue-600 to-indigo-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            prefix: '$',
            delay: 0.1,
            trend: '+12.5%',
            trendUp: true,
        },
        {
            title: 'Items Sold',
            value: totalCount,
            icon: ShoppingBag,
            color: 'from-emerald-600 to-teal-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            delay: 0.2,
            trend: '+8.2%',
            trendUp: true,
        },
        {
            title: 'Average Ticket',
            value: totalCount > 0 ? totalRevenue / totalCount : 0,
            icon: BarChart3,
            color: 'from-purple-600 to-pink-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            prefix: '$',
            delay: 0.3,
            trend: '+5.3%',
            trendUp: true,
        },
        {
            title: 'Transactions',
            value: data.length,
            icon: CreditCard,
            color: 'from-amber-600 to-orange-600',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600',
            delay: 0.4,
            trend: '-2.1%',
            trendUp: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <PageHeader
                        title="Sales Analytics"
                        description="Comprehensive analysis of your daily sales performance and metrics"
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Navigation */}
                            <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <Button
                                    type="text"
                                    icon={<ChevronLeft className="w-4 h-4" />}
                                    onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}
                                    className="h-10 w-10 rounded-none border-r border-slate-200"
                                />
                                <DatePicker
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    allowClear={false}
                                    format="MMMM D, YYYY"
                                    className="w-40 border-0 shadow-none focus:ring-0"
                                    suffixIcon={<Calendar className="w-4 h-4 text-slate-400" />}
                                />
                                <Button
                                    type="text"
                                    icon={<ChevronRight className="w-4 h-4" />}
                                    onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}
                                    className="h-10 w-10 rounded-none border-l border-slate-200"
                                />
                            </div>

                            {/* Refresh Button */}
                            <Button
                                onClick={fetchReport}
                                className="rounded-xl h-10 px-4 border-slate-200 hover:border-slate-300 bg-white"
                            >
                                <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </PageHeader>
                </motion.div>

                {/* KPI Cards */}
                <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-200 mt-8 mb-8 overflow-hidden rounded-2xl border border-gray-200 sm:grid-cols-2 lg:grid-cols-4 shadow-sm">
                    {summaryCards.map((card) => (
                        <div
                            key={card.title}
                            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-8 sm:px-6 xl:px-8"
                        >
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <card.icon className={cn("size-5", card.textColor)} />
                                {card.title}
                            </dt>
                            <dd
                                className={cn(
                                    'text-xs font-semibold',
                                    card.trendUp ? 'text-emerald-600' : 'text-rose-600'
                                )}
                            >
                                {card.trend}
                            </dd>
                            <dd className="w-full flex-none text-3xl font-bold tracking-tight text-gray-900 mt-2">
                                {loading ? '...' : `${card.prefix || ''}${typeof card.value === 'number' ? card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : card.value}`}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* Filters Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
                >
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search products, orders, or SKU..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-44 h-10 bg-white shadow-sm border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="All Categories" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={sortBy}
                                onValueChange={setSortBy}
                            >
                                <SelectTrigger className="w-44 h-10 bg-white shadow-sm border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="Sort by" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date_desc">Latest First</SelectItem>
                                    <SelectItem value="date_asc">Oldest First</SelectItem>
                                    <SelectItem value="amount_desc">Highest Amount</SelectItem>
                                    <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                                    <SelectItem value="qty_desc">Most Quantity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                                <Select
                                    value={selectedShopId}
                                    onValueChange={setSelectedShopId}
                                >
                                    <SelectTrigger className="w-56 h-10 bg-white shadow-sm border-slate-200 focus:ring-blue-500/20">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-blue-500/70" />
                                            <SelectValue placeholder="All Shops" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Shops (Organization)</SelectItem>
                                        {shops.map(shop => (
                                            <SelectItem key={shop.id} value={shop.id.toString()}>
                                                {shop.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Main Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-0 shadow-xl overflow-hidden rounded-2xl">
                        <div className="p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">Sales Transactions</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Showing {filteredData.length} of {totalCount} items
                                        </p>
                                    </div>
                                </div>


                            </div>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={filteredData}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalCount,
                                onChange: (page, size) => {
                                    setCurrentPage(page);
                                    setPageSize(size);
                                },
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} items`,
                                className: "px-6 py-4",
                            }}
                            className="custom-table"
                        />
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}