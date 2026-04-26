"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    Search, RefreshCcw, Eye, CheckCircle2,
    Calendar, User, CreditCard, ShoppingBag,
    Filter, CheckCircle, Clock, Truck, Package, XCircle, MoreVertical, Download,
    Banknote, Wallet, Loader2,
} from 'lucide-react';
import { downloadCsv } from '@/lib/exportCsv';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { StatusPill } from '@/components/(shared-components)/StatusPill';
import { GetWalkinOrdersList, CloseOrder, UpdateOrderStatus, ConfirmOrderPayment } from '@/(api-handlers)/orders_walkinsHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { OrderWalkInsResponse, OrderStatus, PaymentMethod } from '@/interfaces/orders_walkins';
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useCurrency, useOrgCurrency } from '@/hooks/useCurrency';
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
    const fmt         = useCurrency();
    const orgCurrency = useOrgCurrency();

    const [paymentTarget, setPaymentTarget] = useState<OrderWalkInsResponse | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [confirmingPayment, setConfirmingPayment] = useState(false);

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

    const handleConfirmPayment = async () => {
        if (!paymentTarget) return;
        setConfirmingPayment(true);
        try {
            await ConfirmOrderPayment(paymentTarget.id, {
                method: paymentMethod,
                status: 'paid',
                amount_paid: paymentTarget.total_amount ?? paymentTarget.amount_paid ?? 0,
            });
            toast.success('Payment confirmed');
            setPaymentTarget(null);
            fetchOrders(page);
        } catch (error) {
            handleErrorMessage(error, 'Failed to confirm payment');
        } finally {
            setConfirmingPayment(false);
        }
    };

    const filtered = orders.filter(o => {
        const ms = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const mf = filterStatus === 'all' || o.order_status === filterStatus;
        return ms && mf;
    });

    const newCount       = orders.filter(o => o.order_status === 'initiated').length;
    const preparingCount = orders.filter(o => o.order_status === 'preparing').length;

    const handleExport = () => {
        downloadCsv(`orders-${new Date().toISOString().split('T')[0]}.csv`, filtered.map(o => ({
            'Order #':        o.order_number,
            'ID':             o.id,
            'Type':           o.order_type,
            'Customer':       o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Walk-in',
            'Date':           o.created_at,
            [`Amount (${orgCurrency})`]: o.total_amount ?? o.amount_paid ?? 0,
            'Fulfillment':    o.order_status,
            'Payment Status': o.payment_status ?? '',
            'Payment Method': o.payment_method ?? '',
        })));
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Orders & Walk-ins"
                description="Manage customer orders, track fulfillment status, and process walk-in sales."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => fetchOrders(page)} disabled={loading} aria-label="Refresh orders">
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                        <Button variant="outline" onClick={handleExport} disabled={loading || filtered.length === 0}>
                            <Download data-icon="inline-start" /> Export
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
                                                {fmt(order.total_amount ?? order.amount_paid ?? 0)}
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
                                                    <Button variant="ghost" size="icon" className="size-8" aria-label="Order actions">
                                                        <MoreVertical className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52">
                                                    <DropdownMenuLabel>General</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                                                        <Eye className="size-4" /> View details
                                                    </DropdownMenuItem>

                                                    {!order.order_number.startsWith('SALES-') && order.payment_status !== 'paid' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => { setPaymentTarget(order); setPaymentMethod('cash'); }}>
                                                                <Banknote className="size-4" /> Confirm payment
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

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

            <Dialog open={!!paymentTarget} onOpenChange={open => { if (!open) setPaymentTarget(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="size-5" />
                            Confirm Payment
                        </DialogTitle>
                    </DialogHeader>

                    {paymentTarget && (
                        <div className="space-y-4 py-2">
                            <div className="bg-muted rounded-lg p-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Order</span>
                                    <span className="font-bold">#{paymentTarget.order_number}</span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">Amount due</span>
                                    <span className="font-bold">
                                        {fmt(paymentTarget.total_amount ?? paymentTarget.amount_paid ?? 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Payment method</p>
                                <ToggleGroup
                                    type="single"
                                    value={paymentMethod}
                                    onValueChange={v => { if (v) setPaymentMethod(v as PaymentMethod); }}
                                    className="grid grid-cols-3 gap-2"
                                >
                                    {(['cash', 'bank transfer', 'mobile transfer'] as PaymentMethod[]).map(m => (
                                        <ToggleGroupItem
                                            key={m}
                                            value={m}
                                            className="h-9 rounded-md border text-xs capitalize data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                                        >
                                            {m === 'cash' && <Banknote className="mr-1 size-3.5" />}
                                            {m === 'bank transfer' && <CreditCard className="mr-1 size-3.5" />}
                                            {m === 'mobile transfer' && <Wallet className="mr-1 size-3.5" />}
                                            {m}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentTarget(null)} disabled={confirmingPayment}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmPayment} disabled={confirmingPayment}>
                            {confirmingPayment ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
