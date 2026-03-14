"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    Search, RefreshCcw,
    Eye, CheckCircle2,
    Calendar, User,
    CreditCard, ShoppingBag,
    Filter,
    CheckCircle, Clock, Truck, Package, XCircle,
    MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/(shared-components)/PageHeader';
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
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<OrderStatus, { label: string, color: string, icon: React.ElementType }> = {
    initiated: { label: 'Initiated', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    preparing: { label: 'Preparing', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Package },
    ready: { label: 'Ready', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle },
    transported: { label: 'In Transit', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

const paymentStatusConfig = {
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    unpaid: { label: 'Unpaid', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    failed: { label: 'Failed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWalkInsResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    
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

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const data = await GetWalkinOrdersList(shopIdParams);
            // Sort by most recent
            const sortedData = [...data].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setOrders(sortedData);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders, selectedShopId]);

    const handleUpdateStatus = async (id: number, status: OrderStatus) => {
        try {
            await UpdateOrderStatus(id, status);
            toast.success(`Order status updated to ${status}`);
            fetchOrders();
        } catch (error) {
            handleErrorMessage(error, 'Failed to update order status');
        }
    };

    const handleCloseOrder = async (id: number) => {
        try {
            await CloseOrder(id);
            toast.success('Order closed successfully');
            fetchOrders();
        } catch (error) {
            handleErrorMessage(error, 'Failed to close order');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all' || order.order_status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: OrderStatus) => {
        const Icon = statusConfig[status]?.icon || Clock;
        return <Icon className="size-3.5 mr-1" />;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Orders & Walk-ins"
                description="Manage customer orders, track fulfillment status, and process walk-in sales."
            >
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchOrders}
                        className="rounded-xl border-slate-200"
                        disabled={loading}
                    >
                        <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                    <Button
                        onClick={() => router.push('/sales')}
                        className="flex items-center gap-2 rounded-md bg-primary-color hover:opacity-90 shadow-lg shadow-blue-100"
                    >
                        <ShoppingBag className="size-4" />
                        New Sale / Order
                    </Button>
                </div>
            </PageHeader>

            <Card className="mt-8 rounded-md border-slate-100 shadow-sm overflow-hidden p-0">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Search order # or address..."
                                className="pl-9 rounded-md border-slate-200 focus:ring-primary-color"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={filterStatus}
                                onValueChange={(val) => setFilterStatus(val as OrderStatus | 'all')}
                            >
                                <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 rounded-[8px]">
                                    <div className="flex items-center gap-2">
                                        <Filter className="size-4 text-slate-400" />
                                        <SelectValue placeholder="All Statuses" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="initiated">Initiated</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="transported">In Transit</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                                <Select
                                    value={selectedShopId}
                                    onValueChange={(val) => setSelectedShopId(val)}
                                >
                                    <SelectTrigger className="h-10 w-[180px] bg-white border-slate-200 rounded-[8px]">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="size-4 text-slate-400" />
                                            <SelectValue placeholder="All Shops" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Shops</SelectItem>
                                        {shops.map((shop) => (
                                            <SelectItem key={shop.id} value={shop.id.toString()}>
                                                {shop.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-blue-500" />
                                <span>{orders.filter(o => o.order_status === 'initiated').length} New</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-amber-500" />
                                <span>{orders.filter(o => o.order_status === 'preparing').length} In Progress</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 border-b border-slate-100">
                                <TableHead className="px-6 py-4 font-semibold text-slate-600">Order ID</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-slate-600">Customer / Type</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-slate-600">Date & Time</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-slate-600">Total Amount</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-slate-600">Fulfillment</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-slate-600 w-[100px]">Payment</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                                        <RefreshCcw className="size-6 animate-spin mx-auto mb-3 text-primary-color opacity-50" />
                                        <p className="text-sm font-medium">Fetching orders list...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                                        <div className="bg-slate-50 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShoppingBag className="size-8 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-medium">No orders found matching your criteria.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50/40 transition-colors group">
                                        {/* Order ID */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">#{order.order_number}</span>
                                                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">ID: {order.id}</span>
                                            </div>
                                        </TableCell>

                                        {/* Customer / Type */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <User className="size-3.5 text-slate-400" />
                                                    {order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : (order.customer_id ? `Customer #${order.customer_id}` : 'Walk-in Customer')}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] uppercase font-bold px-1.5 py-0 border-slate-200",
                                                        order.order_type === 'sale' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                                    )}>
                                                        {order.order_type}
                                                    </Badge>
                                                    {order.close_at && (
                                                        <Badge className="text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-100 border-none">Closed</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Date & Time */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col text-sm text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                                </div>
                                                <span className="text-xs text-slate-400 mt-0.5 ml-5">{order.order_time}</span>
                                            </div>
                                        </TableCell>

                                        {/* Total Amount */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900">${(order.total_amount ?? order.amount_paid ?? 0).toFixed(2)}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-medium">{order.items?.length ?? 0} Items</span>
                                            </div>
                                        </TableCell>

                                        {/* Fulfillment Status */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <Badge className={cn(
                                                    "w-fit flex items-center shadow-none px-2.5 py-1 rounded-full text-[11px] font-bold border",
                                                    statusConfig[order.order_status]?.color
                                                )}>
                                                    {getStatusIcon(order.order_status)}
                                                    {statusConfig[order.order_status]?.label}
                                                </Badge>
                                                
                                                {order.delivery_address && (
                                                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] mt-1" title={order.delivery_address}>
                                                        {order.delivery_address}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Payment Status */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge className={cn(
                                                    "w-fit shadow-none px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border",
                                                    order.payment_status ? paymentStatusConfig[order.payment_status]?.color : "bg-gray-100 text-gray-700"
                                                )}>
                                                    {order.payment_status ?? 'Unknown'}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
                                                    <CreditCard className="size-2.5" />
                                                    {order.payment_method ?? 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                                                        <MoreVertical className="size-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-100 p-1.5 shadow-xl">
                                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">General</div>
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/orders/${order.id}`)}
                                                        className="rounded-lg py-2 cursor-pointer"
                                                    >
                                                        <Eye className="size-4 mr-2 text-slate-400" />
                                                        View Order Details
                                                    </DropdownMenuItem>

                                                    {!order.close_at && <DropdownMenuSeparator className="bg-slate-50" />}

                                                    {/* Fulfillment Actions */}
                                                    {!order.close_at && (
                                                        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment</div>
                                                    )}

                                                    {order.order_status === 'initiated' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                                            className="rounded-lg py-2 text-amber-600 bg-amber-50/50 focus:bg-amber-50 focus:text-amber-700 cursor-pointer"
                                                        >
                                                            <Package className="size-4 mr-2" />
                                                            Start Preparing
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.order_status === 'preparing' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                                                            className="rounded-lg py-2 text-indigo-600 bg-indigo-50/50 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer"
                                                        >
                                                            <CheckCircle className="size-4 mr-2" />
                                                            Mark as Ready
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.order_status === 'ready' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateStatus(order.id, 'transported')}
                                                            className="rounded-lg py-2 text-purple-600 bg-purple-50/50 focus:bg-purple-50 focus:text-purple-700 cursor-pointer"
                                                        >
                                                            <Truck className="size-4 mr-2" />
                                                            Dispatch Order
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.order_status === 'transported' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                                            className="rounded-lg py-2 text-emerald-600 bg-emerald-50/50 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="size-4 mr-2" />
                                                            Confirm Delivery
                                                        </DropdownMenuItem>
                                                    )}

                                                    {!order.close_at && (
                                                        <>
                                                            <DropdownMenuSeparator className="bg-slate-50" />
                                                            <DropdownMenuItem
                                                                onClick={() => handleCloseOrder(order.id)}
                                                                className="rounded-lg py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                                                            >
                                                                <XCircle className="size-4 mr-2" />
                                                                Close Order & Finalize
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Showing {filteredOrders.length} matching order{filteredOrders.length !== 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-1.5 uppercase font-bold tracking-widest text-[9px]">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Order Data
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
