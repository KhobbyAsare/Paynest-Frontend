/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    Search, ShoppingBag, CircleDollarSign,
    ChevronLeft, ChevronRight, RefreshCcw, Filter,
    BarChart3, Package, CreditCard, Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GetSoldItemsReport } from '@/(api-handlers)/orders_walkinsHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { SoldItem } from '@/interfaces/orders_walkins';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const PAGE_SIZE = 20;

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

export default function SalesReportPage() {
    const fmt = useCurrency();
    const [loading, setLoading]               = useState(false);
    const [data, setData]                     = useState<SoldItem[]>([]);
    const [totalCount, setTotalCount]         = useState(0);
    const [totalRevenue, setTotalRevenue]     = useState(0);
    const [selectedDate, setSelectedDate]     = useState(todayStr());
    const [page, setPage]                     = useState(1);
    const [searchTerm, setSearchTerm]         = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy]                 = useState('date_desc');

    const { user } = useAuthStore();
    const [shops, setShops]                   = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const isAdmin = ['admin', 'superadmin'].includes((user?.role ?? '').toLowerCase());

    useEffect(() => {
        if (!isAdmin) return;
        getOrganizationShops().then(setShops).catch(console.error);
    }, [isAdmin]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const shopId = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const response = await GetSoldItemsReport(selectedDate, page, PAGE_SIZE, shopId);
            setData(response.items);
            setTotalCount(response.total_count);
            setTotalRevenue(response.total_revenue);
        } catch (error) {
            handleErrorMessage(error, 'Failed to load sales report');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, page, selectedShopId]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const stepDate = (dir: 1 | -1) => {
        const next = dir === 1
            ? addDays(parseISO(selectedDate), 1)
            : subDays(parseISO(selectedDate), 1);
        setSelectedDate(next.toISOString().split('T')[0]);
        setPage(1);
    };

    const categories = Array.from(new Set(data.map(i => i.category_name).filter(Boolean))) as string[];

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
                case 'date_asc':    return new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime();
                case 'amount_desc': return b.total_amount - a.total_amount;
                case 'amount_asc':  return a.total_amount - b.total_amount;
                case 'qty_desc':    return b.quantity - a.quantity;
                default:            return new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime();
            }
        });

    const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Sales Analytics"
                description="Daily sales performance — transactions, revenue, and product breakdown."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Date navigator */}
                        <div className="border-border bg-card flex items-center overflow-hidden rounded-lg border">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 rounded-none border-r"
                                onClick={() => stepDate(-1)}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <DatePicker
                                value={selectedDate ? dayjs(selectedDate) : null}
                                onChange={(date) => { setSelectedDate(date ? date.format('YYYY-MM-DD') : todayStr()); setPage(1); }}
                                format="DD MMM YYYY"
                                className="h-9"
                                allowClear={false}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 rounded-none border-l"
                                onClick={() => stepDate(1)}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="icon" className="size-9" onClick={fetchReport} disabled={loading}>
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                    </div>
                }
            />

            {/* KPI strip */}
            <Card className="overflow-hidden p-0">
                <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
                    {(
                        [
                            {
                                label: 'Total Revenue',
                                value: fmt(totalRevenue),
                                icon: CircleDollarSign,
                                sub: format(parseISO(selectedDate), 'MMM d'),
                                iconCls: 'bg-success/10 text-success',
                            },
                            {
                                label: 'Items Sold',
                                value: totalCount.toLocaleString(),
                                icon: ShoppingBag,
                                sub: 'line items',
                                iconCls: 'bg-primary/10 text-primary',
                            },
                            {
                                label: 'Avg per Item',
                                value: fmt(avgTicket),
                                icon: BarChart3,
                                sub: 'average ticket',
                                iconCls: 'bg-info/10 text-info',
                            },
                            {
                                label: 'Transactions',
                                value: data.length.toLocaleString(),
                                icon: CreditCard,
                                sub: 'on this page',
                                iconCls: 'bg-warning/10 text-warning-foreground',
                            },
                        ] as { label: string; value: string; icon: LucideIcon; sub: string; iconCls: string }[]
                    ).map(({ label, value, icon: Icon, sub, iconCls }) => (
                        <div key={label} className="flex items-center gap-3 px-5 py-4">
                            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', iconCls)}>
                                <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground truncate text-xs font-medium">{label}</p>
                                {loading ? (
                                    <Skeleton className="mt-1 h-5 w-16" />
                                ) : (
                                    <p className="text-foreground truncate text-lg font-bold leading-tight num-tabular">{value}</p>
                                )}
                                <p className="text-muted-foreground truncate text-[10px]">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Date label */}
            <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-semibold">
                    {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                </span>
                {selectedDate === todayStr() && (
                    <Badge variant="outline" className="border-success/30 bg-success/10 text-success rounded-full text-[10px]">
                        Today
                    </Badge>
                )}
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search product, order #, SKU…"
                            className="h-9 pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-9 w-[160px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="All categories" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-[160px]">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="Sort by" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date_desc">Latest first</SelectItem>
                                <SelectItem value="date_asc">Oldest first</SelectItem>
                                <SelectItem value="amount_desc">Highest amount</SelectItem>
                                <SelectItem value="amount_asc">Lowest amount</SelectItem>
                                <SelectItem value="qty_desc">Most quantity</SelectItem>
                            </SelectContent>
                        </Select>

                        {isAdmin && (
                            <Select value={selectedShopId} onValueChange={v => { setSelectedShopId(v); setPage(1); }}>
                                <SelectTrigger className="h-9 w-[160px]">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="text-muted-foreground size-3.5" />
                                        <SelectValue placeholder="All shops" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All shops</SelectItem>
                                    {shops.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Product</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Unit price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="pr-6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <BarChart3 className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No sales data</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            No items were sold on {format(parseISO(selectedDate), 'MMMM d, yyyy')}.
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.map((item, idx) => (
                                <TableRow key={`${item.order_number}-${idx}`}>
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                                                <Package className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-foreground font-semibold">{item.product_name}</p>
                                                <div className="mt-0.5 flex items-center gap-2">
                                                    <span className="text-muted-foreground font-mono text-[10px]">{item.product_sku}</span>
                                                    {item.category_name && (
                                                        <Badge variant="secondary" className="rounded-full text-[10px]">
                                                            {item.category_name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <p className="text-primary text-sm font-bold">#{item.order_number}</p>
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="rounded-full font-semibold">
                                            ×{item.quantity}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span className="text-muted-foreground num-tabular text-sm">
                                            {fmt(item.unit_price)}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span className="text-foreground num-tabular font-bold">
                                            {fmt(item.total_amount)}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <span className="text-muted-foreground text-xs">
                                            {format(new Date(item.sold_at), 'h:mm a')}
                                        </span>
                                    </TableCell>

                                    <TableCell className="pr-6">
                                        <Badge
                                            variant="outline"
                                            className="border-success/30 bg-success/10 text-success rounded-full text-xs"
                                        >
                                            Completed
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                {!loading && filteredData.length > 0 && (
                    <div className="border-border bg-muted/30 flex items-center justify-between border-t px-6 py-3 text-xs">
                        <span className="text-muted-foreground">
                            {filteredData.length} item{filteredData.length !== 1 ? 's' : ''} shown · {fmt(filteredData.reduce((s, i) => s + i.total_amount, 0))} total
                        </span>
                        <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest">
                            <span className="bg-success size-1.5 animate-pulse rounded-full" />
                            Live data
                        </div>
                    </div>
                )}
            </Card>

            {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={totalCount} />
            )}
        </div>
    );
}
