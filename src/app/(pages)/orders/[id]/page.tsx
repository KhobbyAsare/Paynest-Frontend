/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, RefreshCcw,
    Calendar, User,
    CreditCard, ShoppingBag,
    Package, Truck, CheckCircle2,
    Clock, Receipt,

    CheckCircle,
    XCircle,
    Download,
    Printer,
    Sparkles,
    Gift,
    BadgeCheck,
    AlertCircle,
    Phone,
    Mail,
    MapPinned,
    Store,
    UserCircle,
    Wallet,
    Banknote,
    Smartphone,
    FileText,
    CircleDollarSign,
    Timer,
    CalendarClock,
} from 'lucide-react';
import { GetWalkinOrderById, CloseOrder, UpdateOrderStatus } from '@/(api-handlers)/orders_walkinsHandler';
import { GetProductByID } from '@/(api-handlers)/productsHandler';
import { OrderWalkInsResponse, OrderStatus } from '@/interfaces/orders_walkins';
import { ProductResponse } from '@/interfaces/products';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Type definitions from your interface
type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'credit' | 'bank_transfer' | string;
type PaymentStatus = 'paid' | 'unpaid' | 'failed' | 'pending' | string;
type OrderType = 'delivery' | 'pickup' | 'dine_in' | 'walk_in' | string;

const statusConfig: Record<OrderStatus, {
    label: string,
    color: string,
    icon: React.ElementType,
    description: string,
    progress: number,
}> = {
    initiated: {
        label: 'Initiated',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
        description: 'Order has been created and payment is being processed.',
        progress: 20,
    },
    preparing: {
        label: 'Preparing',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Package,
        description: 'Items are being picked, packed, and prepared.',
        progress: 40,
    },
    ready: {
        label: 'Ready for Pickup',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: CheckCircle,
        description: 'Order is ready to be picked up by the customer.',
        progress: 60,
    },
    transported: {
        label: 'In Transit',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Truck,
        description: 'Order is on its way with the delivery team.',
        progress: 80,
    },
    delivered: {
        label: 'Delivered',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        description: 'Order has been successfully delivered to the customer.',
        progress: 100,
    },
};

const paymentMethodIcons: Record<string, React.ElementType> = {
    cash: Banknote,
    card: CreditCard,
    mobile_money: Smartphone,
    credit: Wallet,
    bank_transfer: FileText,
};

const paymentStatusConfig: Record<string, { label: string, color: string, icon: React.ElementType }> = {
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    unpaid: { label: 'Unpaid', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle },
    failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Timer },
};

const orderTypeConfig: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    delivery: { label: 'Delivery', icon: Truck, color: 'text-purple-600 bg-purple-50' },
    pickup: { label: 'Pickup', icon: Store, color: 'text-blue-600 bg-blue-50' },
    dine_in: { label: 'Dine In', icon: User, color: 'text-emerald-600 bg-emerald-50' },
    walk_in: { label: 'Walk-in', icon: UserCircle, color: 'text-amber-600 bg-amber-50' },
};

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderWalkInsResponse | null>(null);
    const [products, setProducts] = useState<Record<number, ProductResponse>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<boolean>(false);

    const fetchOrderDetails = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const orderData = await GetWalkinOrderById(Number(id));
            setOrder(orderData);

            // Fetch product details for all items
            const productIds = Array.from(new Set(((orderData.items as any[]) || []).map(item => item.product_id)));
            const productResults = await Promise.allSettled(
                productIds.map(pid => GetProductByID(pid))
            );

            const productMap: Record<number, ProductResponse> = {};
            productResults.forEach((res, index) => {
                if (res.status === 'fulfilled') {
                    productMap[productIds[index]] = res.value;
                }
            });
            setProducts(productMap);

        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handleUpdateStatus = async (status: OrderStatus) => {
        if (!order) return;
        setUpdating(true);
        try {
            await UpdateOrderStatus(order.id, status);
            toast.success(`Order status updated to ${statusConfig[status].label}`);
            fetchOrderDetails();
        } catch (error) {
            handleErrorMessage(error, 'Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCloseOrder = async () => {
        if (!order) return;
        setUpdating(true);
        try {
            await CloseOrder(order.id);
            toast.success('Order closed successfully');
            fetchOrderDetails();
        } catch (error) {
            handleErrorMessage(error, 'Failed to close order');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                        <RefreshCcw className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-slate-500 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
            >
                <Card className="max-w-md w-full border border-slate-200 shadow-lg p-2">
                    <CardContent className="pt-12 pb-10 text-center">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12 text-rose-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">Order Not Found</h2>
                        <p className="text-slate-500 mb-8">The order you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                        <Button
                            onClick={() => router.push('/orders')}
                            className="rounded-lg px-8 h-12 bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Orders
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    const currentStatus = statusConfig[order.order_status];
    const StatusIcon = currentStatus.icon;
    const PaymentMethodIcon = paymentMethodIcons[order.payment_method] || CreditCard;
    const OrderTypeIcon = orderTypeConfig[order.order_type]?.icon || ShoppingBag;
    const PaymentStatusIcon = paymentStatusConfig[order.payment_status]?.icon || CircleDollarSign;

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                        <div className="flex items-start gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/orders')}
                                className="rounded-lg h-12 w-12 hover:bg-white hover:shadow-md transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                                        Order #{order.order_number}
                                    </h1>
                                    <Badge className={cn(
                                        "rounded-full px-3 py-1 text-xs font-semibold",
                                        currentStatus.color
                                    )}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {currentStatus.label}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>{format(new Date(order.order_date), 'MMMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{order.order_time}</span>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-full",
                                        orderTypeConfig[order.order_type]?.color || 'bg-slate-50 text-slate-600'
                                    )}>
                                        <OrderTypeIcon className="w-3 h-3" />
                                        <span className="text-xs font-medium">
                                            {orderTypeConfig[order.order_type]?.label || order.order_type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="rounded-lg h-11 border-slate-200 hover:border-slate-300 hover:bg-white"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-lg h-11 border-slate-200 hover:border-slate-300 hover:bg-white"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        className="rounded-lg h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-lg px-6"
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 mr-2" />
                                        )}
                                        Update Status
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 rounded-lg p-2">
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <DropdownMenuItem
                                            key={key}
                                            onClick={() => handleUpdateStatus(key as OrderStatus)}
                                            className={cn(
                                                "rounded-lg py-2.5 px-3 mb-1 cursor-pointer",
                                                order.order_status === key && "bg-slate-50"
                                            )}
                                        >
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mr-3", config.color)}>
                                                <config.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-700">{config.label}</p>
                                                <p className="text-xs text-slate-400">{config.description.substring(0, 30)}...</p>
                                            </div>
                                            {order.order_status === key && (
                                                <BadgeCheck className="w-4 h-4 text-emerald-500 ml-2" />
                                            )}
                                        </DropdownMenuItem>
                                    ))}

                                    {!order.close_at && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleCloseOrder}
                                                className="rounded-lg py-2.5 px-3 text-rose-600 focus:text-rose-600 cursor-pointer"
                                            >
                                                <XCircle className="w-4 h-4 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium">Close Order</p>
                                                    <p className="text-xs text-slate-400">Finalize and archive this order</p>
                                                </div>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Status Timeline Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="p-2 border border-slate-200 shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={cn(
                                                "w-16 h-16 rounded-xl flex items-center justify-center",
                                                currentStatus.color
                                            )}>
                                                <StatusIcon className="w-8 h-8" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-800">
                                                        Current Status: {currentStatus.label}
                                                    </h3>
                                                    <Badge className={cn("rounded-full px-3", currentStatus.color)}>
                                                        {currentStatus.progress}% Complete
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-500 text-sm mb-4">
                                                    {currentStatus.description}
                                                </p>

                                                <Progress value={currentStatus.progress} className="h-2 bg-slate-100" />
                                            </div>
                                        </div>

                                        {/* Timeline Steps */}
                                        <div className="relative mt-8">
                                            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -translate-y-1/2" />
                                            <div className="relative flex justify-between">
                                                {Object.entries(statusConfig).map(([key, config], index) => {
                                                    const isActive = key === order.order_status;
                                                    const isPast = Object.keys(statusConfig).indexOf(key) <
                                                        Object.keys(statusConfig).indexOf(order.order_status);

                                                    return (
                                                        <Tooltip key={key}>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex flex-col items-center">
                                                                    <div className={cn(
                                                                        "relative z-10 w-10 h-10 rounded-full border-4 bg-white flex items-center justify-center transition-all",
                                                                        isActive ? "border-blue-600 shadow-lg" :
                                                                            isPast ? "border-emerald-500" : "border-slate-200"
                                                                    )}>
                                                                        <config.icon className={cn(
                                                                            "w-4 h-4",
                                                                            isActive ? "text-blue-600" :
                                                                                isPast ? "text-emerald-500" : "text-slate-300"
                                                                        )} />
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-xs font-medium mt-2",
                                                                        isActive ? "text-blue-600" :
                                                                            isPast ? "text-emerald-600" : "text-slate-400"
                                                                    )}>
                                                                        {config.label}
                                                                    </span>
                                                                    {/* Status Timestamp */}
                                                                    {(() => {
                                                                        const timestampField = {
                                                                            initiated: 'created_at',
                                                                            preparing: 'preparing_at',
                                                                            ready: 'ready_at',
                                                                            transported: 'transported_at',
                                                                            delivered: 'actual_delivery_date'
                                                                        }[key];
                                                                        const ts = order[timestampField as keyof OrderWalkInsResponse];
                                                                        if (!ts) return null;
                                                                        return (
                                                                            <div className="flex flex-col items-center mt-1">
                                                                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                                    {format(new Date(ts as string), 'HH:mm')}
                                                                                </span>
                                                                                <span className="text-[9px] text-slate-300 whitespace-nowrap">
                                                                                    {format(new Date(ts as string), 'MMM d')}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom" className="max-w-xs">
                                                                <p className="text-xs">{config.description}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}

                                                {/* Final 'Closed' status if applicable */}
                                                {order.close_at && (
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative z-10 w-10 h-10 rounded-full border-4 bg-slate-100 border-slate-300 flex items-center justify-center">
                                                            <XCircle className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <span className="text-xs font-medium mt-2 text-slate-500">
                                                            Closed
                                                        </span>
                                                        <div className="flex flex-col items-center mt-1">
                                                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                {format(new Date(order.close_at), 'HH:mm')}
                                                            </span>
                                                            <span className="text-[9px] text-slate-300 whitespace-nowrap">
                                                                {format(new Date(order.close_at), 'MMM d')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Order Items Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="border border-slate-200 shadow-sm">
                                    <CardHeader className="border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <div className="p-2 bg-indigo-100 rounded-lg">
                                                    <Receipt className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                Order Items
                                            </CardTitle>
                                            <Badge variant="outline" className="rounded-full px-3">
                                                {((order.items as any[]) || []).length} items
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50">
                                                    <TableHead className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Product
                                                    </TableHead>
                                                    <TableHead className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                                                        Price
                                                    </TableHead>
                                                    <TableHead className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                                        Quantity
                                                    </TableHead>
                                                    <TableHead className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                                                        Subtotal
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {((order.items as any[]) || []).map((item, idx) => {
                                                    const product = products[item.product_id];
                                                    const price = product?.selling_price || 0;
                                                    const subtotal = price * item.quantity;

                                                    return (
                                                        <TableRow key={`${item.product_id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                            <TableCell className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                                                        <Package className="w-6 h-6 text-slate-500" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-slate-800">
                                                                            {product?.name || `Product #${item.product_id}`}
                                                                        </div>
                                                                        {product?.sku && (
                                                                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                                                SKU: {product.sku}
                                                                            </div>
                                                                        )}
                                                                        {item.notes && (
                                                                            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                                                <AlertCircle className="w-3 h-3" />
                                                                                {item.notes}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-5 text-right font-medium text-slate-600">
                                                                GHS {price.toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="px-6 py-5 text-center">
                                                                <Badge variant="secondary" className="rounded-full px-3">
                                                                    x {item.quantity}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-5 text-right font-bold text-slate-900">
                                                                GHS {subtotal.toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="p-6 border-t border-slate-100 bg-slate-50">
                                        <div className="flex justify-end">
                                            <div className="w-full max-w-xs space-y-3">
                                                {order.subtotal != null && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500">Subtotal</span>
                                                        <span className="font-medium text-slate-700">
                                                            GHS {order.subtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                {order.tax_amount > 0 && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500">Tax</span>
                                                        <span className="font-medium text-slate-700">
                                                            GHS {order.tax_amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                {order.discount_amount > 0 && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500 flex items-center gap-1">
                                                            <Gift className="w-3 h-3" />
                                                            Discount
                                                        </span>
                                                        <span className="font-medium text-emerald-600">
                                                            -GHS {order.discount_amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Delivery</span>
                                                    <span className="font-medium text-slate-700">
                                                        GHS {order.delivery_amount.toFixed(2)}
                                                    </span>
                                                </div>

                                                <Separator className="bg-slate-200" />

                                                <div className="flex justify-between items-center">
                                                    <span className="text-base font-semibold text-slate-700">Total</span>
                                                    <span className="text-2xl font-bold text-slate-900">
                                                        GHS {order.total_amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Customer Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="p-2 border border-slate-200 shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-slate-700">Customer Information</h3>
                                        </div>

                                        {order.customer ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                                            {order.customer.first_name?.[0]}{order.customer.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">
                                                            {order.customer.first_name} {order.customer.last_name}
                                                        </h4>
                                                        <p className="text-xs text-slate-400">
                                                            {order.customer.customer_code}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Separator className="bg-slate-100" />

                                                <div className="space-y-3">
                                                    {order.customer.email && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">{order.customer.email}</span>
                                                        </div>
                                                    )}

                                                    {order.customer.phone && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Phone className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">{order.customer.phone}</span>
                                                        </div>
                                                    )}

                                                    {order.customer.address && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <MapPinned className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">{order.customer.address}</span>
                                                        </div>
                                                    )}

                                                    {order.customer.loyalty_points > 0 && (
                                                        <div className="flex items-center gap-2 text-sm p-2 bg-amber-50 rounded-lg">
                                                            <Gift className="w-4 h-4 text-amber-600" />
                                                            <span className="text-amber-700 font-medium">
                                                                {order.customer.loyalty_points} points
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <UserCircle className="w-10 h-10 text-slate-400" />
                                                <div>
                                                    <p className="font-medium text-slate-700">Walk-in Customer</p>
                                                    <p className="text-xs text-slate-400">No registered account</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Delivery Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="border border-slate-200 shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Truck className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <h3 className="font-semibold text-slate-700">Delivery Information</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {order.delivery_address ? (
                                                <div className="p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-xs font-medium text-slate-400 mb-1">Delivery Address</p>
                                                    <p className="text-sm text-slate-700">{order.delivery_address}</p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-slate-50 rounded-lg text-center">
                                                    <Store className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-500">Store Pickup / Walk-in</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-xs font-medium text-slate-400 mb-1">Expected</p>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {order.expected_delivery_date
                                                            ? format(new Date(order.expected_delivery_date), 'MMM d, yyyy')
                                                            : 'N/A'
                                                        }
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-xs font-medium text-slate-400 mb-1">Actual</p>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {order.actual_delivery_date
                                                            ? format(new Date(order.actual_delivery_date), 'MMM d, yyyy')
                                                            : 'Pending'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <span className="text-xs font-medium text-slate-400">Delivery Status</span>
                                                {order.is_delivered ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Delivered
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        In Progress
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Payment Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Card className="border border-slate-200 shadow-sm bg-slate-900 text-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-white/10 rounded-lg">
                                                    <CreditCard className="w-4 h-4" />
                                                </div>
                                                <h3 className="font-semibold">Payment Overview</h3>
                                            </div>
                                            <Badge className={cn(
                                                "rounded-full px-3",
                                                paymentStatusConfig[order.payment_status]?.color.replace('text-', 'text-white').replace('bg-', 'bg-white/20')
                                            )}>
                                                <PaymentStatusIcon className="w-3 h-3 mr-1" />
                                                {paymentStatusConfig[order.payment_status]?.label || order.payment_status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-3xl font-bold mb-1">
                                                    GHS {order.amount_paid.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-white/60 flex items-center gap-1">
                                                    <PaymentMethodIcon className="w-3 h-3" />
                                                    via {order.payment_method?.replace('_', ' ') || 'N/A'}
                                                </p>
                                            </div>

                                            {order.amount_due > 0 && (
                                                <div className="p-3 bg-white/10 rounded-lg">
                                                    <p className="text-xs text-white/60 mb-1">Amount Due</p>
                                                    <p className="text-lg font-bold text-amber-300">
                                                        GHS {order.amount_due.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}

                                            {order.close_at && (
                                                <div className="p-3 bg-white/10 rounded-lg flex items-center gap-2">
                                                    <CalendarClock className="w-4 h-4 text-white/60" />
                                                    <div>
                                                        <p className="text-xs text-white/60">Closed at</p>
                                                        <p className="text-sm font-medium">
                                                            {format(new Date(order.close_at), 'MMM d, yyyy HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}