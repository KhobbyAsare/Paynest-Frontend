"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    Search, RefreshCcw, Eye, CheckCircle2,
    Calendar, User, CreditCard, ShoppingBag,
    Filter, CheckCircle, Clock, Truck, Package, XCircle, MoreVertical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { StatusPill } from '@/components/(shared-components)/StatusPill';
import { GetWalkinOrdersList, CloseOrder, UpdateOrderStatus } from '@/(api-handlers)/orders_walkinsHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { OrderWalkInsResponse, OrderStatus } from '@/interfaces/orders_walkins';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FULFILLMENT_ICON: Record<OrderStatus, React.ElementType> = {
    initiated: Clock,
    preparing: Package,
    ready: CheckCircle,
    transported: Truck,
    delivered: CheckCircle2,
};

const PAGE_SIZE = 20;

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWalkInsResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const { user } = useAuthStore();
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const role = (user?.role || 'attendant').toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    useEffect(() => {
        if (!isAdmin) return;
        getOrganizationShops().then(setShops).catch(console.error);
    }, [isAdmin]);

    const fetchOrders = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const shopId = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const data = await GetWalkinOrdersList(shopId, (p - 1) * PAGE_SIZE, PAGE_SIZE);
            setOrders(data.items);
            setTotal(data.total);
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [selectedShopId]);

    useEffect(() => { fetchOrders(page); }, [page, fetchOrders]);

    const handleUpdateStatus = async (id: number, status: OrderStatus) => {
        try {
            await UpdateOrderStatus(id, status);
            toast.success(`Order status updated to ${status}`);
            fetchOrders(page);
        } catch (error) { handleErrorMessage(error, 'Failed to update status'); }
    };

    const handleCloseOrder = async (id: number) => {
        try {
            await CloseOrder(id);
            toast.success('Order closed');
            fetchOrders(page);
        } catch (error) { handleErrorMessage(error, 'Failed to close order'); }
    };

    const filtered = orders.filter(o => {
        const ms = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const mf = filterStatus === 'all' || o.order_status === filterStatus;
        return ms && mf;
    });

    const newCount       = orders.filter(o => o.order_status === 'initiated').length;
    const preparingCount = orders.filter(o => o.order_status === 'preparing').length;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Orders & Walk-ins"
                description="Manage customer orders, track fulfillment status, and process walk-in sales."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => fetchOrders(page)} disabled={loading}>
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                        <Button onClick={() => router.push('/sales')}>
                            <ShoppingBag data-icon="inline-start" />
                            New Sale
                        </Button>
                    </div>
                }
            />

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-6">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search order # or address…"
                            className="h-9 pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as OrderStatus | 'all')}>
                            <SelectTrigger className="h-9 w-[160px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="All statuses" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="initiated">Initiated</SelectItem>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="transported">In Transit</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                        </Select>

                        {isAdmin && (
                            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                                <SelectTrigger className="h-9 w-[170px]">
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

                        <div className="text-muted-foreground hidden items-center gap-3 text-xs lg:flex">
                            <span className="flex items-center gap-1.5">
                                <span className="bg-info size-2 rounded-full" />
                                {newCount} new
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="bg-warning size-2 rounded-full" />
                                {preparingCount} preparing
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Fulfillment</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-5 w-full rounded" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <ShoppingBag className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No orders match your criteria.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(order => {
                                const FulIcon = FULFILLMENT_ICON[order.order_status] ?? Clock;
                                return (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer"
                                        onClick={() => router.push(`/orders/${order.id}`)}
                                    >
                                        <TableCell className="pl-6">
                                            <p className="text-foreground font-bold">#{order.order_number}</p>
                                            <p className="text-muted-foreground num-tabular font-mono text-[10px]">ID {order.id}</p>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <User className="text-muted-foreground size-3.5 shrink-0" />
                                                <span className="text-foreground text-sm font-medium">
                                                    {order.customer
                                                        ? `${order.customer.first_name} ${order.customer.last_name}`
                                                        : order.customer_id ? `Customer #${order.customer_id}` : 'Walk-in'}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'mt-1 border-0 px-1.5 py-0 text-[10px] font-bold uppercase',
                                                    order.order_type === 'sale'
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-warning/10 text-warning-foreground',
                                                )}
                                            >
                                                {order.order_type}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Calendar className="text-muted-foreground size-3.5 shrink-0" />
                                                <span>{format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                                            </div>
                                            <p className="text-muted-foreground mt-0.5 ml-5 text-xs">{order.order_time}</p>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <p className="text-foreground num-tabular font-bold">
                                                GHS {(order.total_amount ?? order.amount_paid ?? 0).toFixed(2)}
                                            </p>
                                            <p className="text-muted-foreground text-[10px]">
                                                {order.items?.length ?? 0} items
                                            </p>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <FulIcon className="text-muted-foreground size-3.5 shrink-0" />
                                                <StatusPill status={order.order_status} showIcon={false} />
                                            </div>
                                            {order.delivery_address && (
                                                <p className="text-muted-foreground mt-1 max-w-[120px] truncate text-[10px]">
                                                    {order.delivery_address}
                                                </p>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <StatusPill status={order.payment_status ?? 'muted'} />
                                            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px] font-medium uppercase">
                                                <CreditCard className="size-2.5" />
                                                {order.payment_method ?? 'N/A'}
                                            </div>
                                        </TableCell>

                                        <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreVertical className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52">
                                                    <DropdownMenuLabel>General</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                                                        <Eye className="size-4" /> View details
                                                    </DropdownMenuItem>

                                                    {!order.close_at && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel>Fulfillment</DropdownMenuLabel>
                                                            {order.order_status === 'initiated' && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'preparing')}>
                                                                    <Package className="size-4" /> Start preparing
                                                                </DropdownMenuItem>
                                                            )}
                                                            {order.order_status === 'preparing' && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'ready')}>
                                                                    <CheckCircle className="size-4" /> Mark as ready
                                                                </DropdownMenuItem>
                                                            )}
                                                            {order.order_status === 'ready' && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'transported')}>
                                                                    <Truck className="size-4" /> Dispatch
                                                                </DropdownMenuItem>
                                                            )}
                                                            {order.order_status === 'transported' && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                                                                    <CheckCircle2 className="size-4" /> Confirm delivery
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => handleCloseOrder(order.id)}
                                                            >
                                                                <XCircle className="size-4" /> Close & finalise
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="border-border bg-muted/30 flex items-center justify-between border-t px-6 py-3 text-xs">
                        <span className="text-muted-foreground">
                            {filtered.length} order{filtered.length !== 1 ? 's' : ''} on this page
                        </span>
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-widest text-[9px]">
                            <span className="bg-success size-1.5 animate-pulse rounded-full" />
                            Live data
                        </div>
                    </div>
                )}
            </Card>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={total} />
        </div>
    );
}
