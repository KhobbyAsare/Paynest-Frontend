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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'credit' | 'bank_transfer' | string;
type PaymentStatus = 'paid' | 'unpaid' | 'failed' | 'pending' | string;
type OrderType = 'delivery' | 'pickup' | 'dine_in' | 'walk_in' | string;

const statusConfig: Record<OrderStatus, {
    label: string;
    badgeClass: string;
    icon: React.ElementType;
    description: string;
    progress: number;
}> = {
    initiated: {
        label: 'Initiated',
        badgeClass: 'border-primary/20 bg-primary/10 text-primary',
        icon: Clock,
        description: 'Order has been created and payment is being processed.',
        progress: 20,
    },
    preparing: {
        label: 'Preparing',
        badgeClass: 'border-warning/30 bg-warning/10 text-warning-foreground',
        icon: Package,
        description: 'Items are being picked, packed, and prepared.',
        progress: 40,
    },
    ready: {
        label: 'Ready for Pickup',
        badgeClass: 'border-info/30 bg-info/10 text-info',
        icon: CheckCircle,
        description: 'Order is ready to be picked up by the customer.',
        progress: 60,
    },
    transported: {
        label: 'In Transit',
        badgeClass: 'border-primary/20 bg-primary/10 text-primary',
        icon: Truck,
        description: 'Order is on its way with the delivery team.',
        progress: 80,
    },
    delivered: {
        label: 'Delivered',
        badgeClass: 'border-success/30 bg-success/10 text-success',
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

const paymentStatusConfig: Record<string, {
    label: string;
    badgeClass: string;
    icon: React.ElementType;
}> = {
    paid:    { label: 'Paid',    badgeClass: 'border-success/30 bg-success/10 text-success',           icon: CheckCircle2 },
    unpaid:  { label: 'Unpaid',  badgeClass: 'border-destructive/30 bg-destructive/10 text-destructive', icon: AlertCircle  },
    failed:  { label: 'Failed',  badgeClass: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle      },
    pending: { label: 'Pending', badgeClass: 'border-warning/30 bg-warning/10 text-warning-foreground', icon: Timer        },
};

const orderTypeConfig: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    delivery: { label: 'Delivery', icon: Truck,       cls: 'text-primary bg-primary/10'             },
    pickup:   { label: 'Pickup',   icon: Store,       cls: 'text-info bg-info/10'                   },
    dine_in:  { label: 'Dine In',  icon: User,        cls: 'text-success bg-success/10'             },
    walk_in:  { label: 'Walk-in',  icon: UserCircle,  cls: 'text-warning-foreground bg-warning/10'  },
};

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder]       = useState<OrderWalkInsResponse | null>(null);
    const [products, setProducts] = useState<Record<number, ProductResponse>>({});
    const [loading, setLoading]   = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchOrderDetails = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const orderData = await GetWalkinOrderById(Number(id));
            setOrder(orderData);

            const productIds = Array.from(new Set(((orderData.items as any[]) || []).map(item => item.product_id)));
            const productResults = await Promise.allSettled(productIds.map(pid => GetProductByID(pid)));

            const productMap: Record<number, ProductResponse> = {};
            productResults.forEach((res, index) => {
                if (res.status === 'fulfilled') productMap[productIds[index]] = res.value;
            });
            setProducts(productMap);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

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
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col gap-6">
                <Card className="p-12 text-center">
                    <div className="bg-destructive/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                        <ShoppingBag className="text-destructive size-8" />
                    </div>
                    <p className="text-foreground font-semibold">Order Not Found</p>
                    <p className="text-muted-foreground mt-1 text-sm mb-6">
                        The order you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Button variant="outline" onClick={() => router.push('/orders')}>
                        <ChevronLeft className="mr-2 size-4" />
                        Back to Orders
                    </Button>
                </Card>
            </div>
        );
    }

    const currentStatus = statusConfig[order.order_status];
    const StatusIcon = currentStatus.icon;
    const PaymentMethodIcon = paymentMethodIcons[order.payment_method] || CreditCard;
    const OrderTypeIcon = orderTypeConfig[order.order_type]?.icon || ShoppingBag;
    const PaymentStatusIcon = paymentStatusConfig[order.payment_status]?.icon || CircleDollarSign;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/orders')}
                            className="size-9 shrink-0"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h1 className="text-foreground text-2xl font-bold lg:text-3xl">
                                    Order #{order.order_number}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={cn('rounded-full px-3 py-1 text-xs font-semibold', currentStatus.badgeClass)}
                                >
                                    <StatusIcon className="mr-1 size-3" />
                                    {currentStatus.label}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="size-4" />
                                    {format(new Date(order.order_date), 'MMMM d, yyyy')}
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="size-4" />
                                    {order.order_time}
                                </span>
                                {orderTypeConfig[order.order_type] && (
                                    <span className={cn(
                                        'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                                        orderTypeConfig[order.order_type].cls,
                                    )}>
                                        <OrderTypeIcon className="size-3" />
                                        {orderTypeConfig[order.order_type].label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9">
                            <Printer className="mr-2 size-4" />
                            Print
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-9 px-5" disabled={updating}>
                                    {updating
                                        ? <RefreshCcw className="mr-2 size-4 animate-spin" />
                                        : <Sparkles className="mr-2 size-4" />
                                    }
                                    Update Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2">
                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                    <DropdownMenuItem
                                        key={key}
                                        onClick={() => handleUpdateStatus(key as OrderStatus)}
                                        className={cn(
                                            'mb-1 cursor-pointer rounded-lg px-3 py-2.5',
                                            order.order_status === key && 'bg-muted',
                                        )}
                                    >
                                        <div className={cn('mr-3 flex size-8 items-center justify-center rounded-lg', cfg.badgeClass)}>
                                            <cfg.icon className="size-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-foreground text-sm font-medium">{cfg.label}</p>
                                            <p className="text-muted-foreground text-xs">{cfg.description.substring(0, 32)}…</p>
                                        </div>
                                        {order.order_status === key && (
                                            <BadgeCheck className="text-success ml-2 size-4" />
                                        )}
                                    </DropdownMenuItem>
                                ))}

                                {!order.close_at && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleCloseOrder}
                                            className="cursor-pointer rounded-lg px-3 py-2.5 text-destructive focus:text-destructive"
                                        >
                                            <XCircle className="mr-3 size-4" />
                                            <div>
                                                <p className="text-sm font-medium">Close Order</p>
                                                <p className="text-muted-foreground text-xs">Finalize and archive this order</p>
                                            </div>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left — main content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Status Timeline */}
                        <Card className="gap-0 p-0">
                            <CardContent className="p-6">
                                <div className="mb-6 flex items-start gap-4">
                                    <div className={cn(
                                        'flex size-16 shrink-0 items-center justify-center rounded-xl',
                                        currentStatus.badgeClass,
                                    )}>
                                        <StatusIcon className="size-8" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <h3 className="text-foreground text-lg font-bold">
                                                Current Status: {currentStatus.label}
                                            </h3>
                                            <Badge variant="outline" className={cn('rounded-full px-3', currentStatus.badgeClass)}>
                                                {currentStatus.progress}% Complete
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-4 text-sm">{currentStatus.description}</p>
                                        <Progress value={currentStatus.progress} className="h-2" />
                                    </div>
                                </div>

                                {/* Timeline steps */}
                                <div className="relative mt-8">
                                    <div className="bg-border absolute left-0 top-5 h-0.5 w-full" />
                                    <div className="relative flex justify-between">
                                        {Object.entries(statusConfig).map(([key, cfg]) => {
                                            const statusKeys = Object.keys(statusConfig);
                                            const isActive = key === order.order_status;
                                            const isPast = statusKeys.indexOf(key) < statusKeys.indexOf(order.order_status);
                                            return (
                                                <Tooltip key={key}>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex flex-col items-center">
                                                            <div className={cn(
                                                                'relative z-10 flex size-10 items-center justify-center rounded-full border-4 bg-background transition-all',
                                                                isActive ? 'border-primary shadow-lg' :
                                                                    isPast ? 'border-success' : 'border-border',
                                                            )}>
                                                                <cfg.icon className={cn(
                                                                    'size-4',
                                                                    isActive ? 'text-primary' :
                                                                        isPast ? 'text-success' : 'text-muted-foreground/40',
                                                                )} />
                                                            </div>
                                                            <span className={cn(
                                                                'mt-2 text-xs font-medium',
                                                                isActive ? 'text-primary' :
                                                                    isPast ? 'text-success' : 'text-muted-foreground',
                                                            )}>
                                                                {cfg.label}
                                                            </span>
                                                            {(() => {
                                                                const tsField = {
                                                                    initiated: 'created_at',
                                                                    preparing: 'preparing_at',
                                                                    ready: 'ready_at',
                                                                    transported: 'transported_at',
                                                                    delivered: 'actual_delivery_date',
                                                                }[key];
                                                                const ts = order[tsField as keyof OrderWalkInsResponse];
                                                                if (!ts) return null;
                                                                return (
                                                                    <div className="mt-1 flex flex-col items-center">
                                                                        <span className="text-foreground whitespace-nowrap text-[10px] font-bold">
                                                                            {format(new Date(ts as string), 'HH:mm')}
                                                                        </span>
                                                                        <span className="text-muted-foreground whitespace-nowrap text-[9px]">
                                                                            {format(new Date(ts as string), 'MMM d')}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-xs">
                                                        <p className="text-xs">{cfg.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}

                                        {order.close_at && (
                                            <div className="flex flex-col items-center">
                                                <div className="bg-muted border-border relative z-10 flex size-10 items-center justify-center rounded-full border-4">
                                                    <XCircle className="text-muted-foreground size-4" />
                                                </div>
                                                <span className="text-muted-foreground mt-2 text-xs font-medium">Closed</span>
                                                <div className="mt-1 flex flex-col items-center">
                                                    <span className="text-foreground whitespace-nowrap text-[10px] font-bold">
                                                        {format(new Date(order.close_at), 'HH:mm')}
                                                    </span>
                                                    <span className="text-muted-foreground whitespace-nowrap text-[9px]">
                                                        {format(new Date(order.close_at), 'MMM d')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items */}
                        <Card className="gap-0 overflow-hidden p-0">
                            <CardHeader className="border-border border-b px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                                            <Receipt className="text-primary size-4" />
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
                                        <TableRow>
                                            <TableHead className="pl-6">Product</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="pr-6 text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {((order.items as any[]) || []).map((item, idx) => {
                                            const product = products[item.product_id];
                                            const price = product?.selling_price || 0;
                                            const subtotal = price * item.quantity;
                                            return (
                                                <TableRow key={`${item.product_id}-${idx}`}>
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                                                                <Package className="text-muted-foreground size-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-foreground font-semibold">
                                                                    {product?.name || `Product #${item.product_id}`}
                                                                </p>
                                                                {product?.sku && (
                                                                    <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                                                                        SKU: {product.sku}
                                                                    </p>
                                                                )}
                                                                {item.notes && (
                                                                    <p className="text-warning-foreground mt-1 flex items-center gap-1 text-xs">
                                                                        <AlertCircle className="size-3" />
                                                                        {item.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-muted-foreground text-sm">
                                                            GHS {price.toFixed(2)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="rounded-full px-3">
                                                            ×{item.quantity}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <span className="text-foreground font-bold">
                                                            GHS {subtotal.toFixed(2)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Order summary footer */}
                            <div className="border-border bg-muted/30 border-t p-6">
                                <div className="ml-auto w-full max-w-xs space-y-3">
                                    {order.subtotal != null && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="text-foreground font-medium">
                                                GHS {order.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {order.tax_amount > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span className="text-foreground font-medium">
                                                GHS {order.tax_amount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {order.discount_amount > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Gift className="size-3" /> Discount
                                            </span>
                                            <span className="text-success font-medium">
                                                -GHS {order.discount_amount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span className="text-foreground font-medium">
                                            GHS {order.delivery_amount.toFixed(2)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-foreground font-semibold">Total</span>
                                        <span className="text-foreground text-2xl font-bold">
                                            GHS {order.total_amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right — sidebar */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <Card className="gap-0 p-0">
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                                        <User className="text-primary size-4" />
                                    </div>
                                    <h3 className="text-foreground font-semibold">Customer</h3>
                                </div>

                                {order.customer ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-12">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {order.customer.first_name?.[0]}{order.customer.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-foreground font-semibold">
                                                    {order.customer.first_name} {order.customer.last_name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">{order.customer.customer_code}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            {order.customer.email && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="text-muted-foreground size-4" />
                                                    <span className="text-foreground">{order.customer.email}</span>
                                                </div>
                                            )}
                                            {order.customer.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="text-muted-foreground size-4" />
                                                    <span className="text-foreground">{order.customer.phone}</span>
                                                </div>
                                            )}
                                            {order.customer.address && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPinned className="text-muted-foreground size-4" />
                                                    <span className="text-foreground">{order.customer.address}</span>
                                                </div>
                                            )}
                                            {order.customer.loyalty_points > 0 && (
                                                <div className="bg-warning/10 flex items-center gap-2 rounded-lg p-2 text-sm">
                                                    <Gift className="text-warning-foreground size-4" />
                                                    <span className="text-warning-foreground font-medium">
                                                        {order.customer.loyalty_points} loyalty points
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted/40 flex items-center gap-3 rounded-lg p-3">
                                        <UserCircle className="text-muted-foreground size-10" />
                                        <div>
                                            <p className="text-foreground font-medium">Walk-in Customer</p>
                                            <p className="text-muted-foreground text-xs">No registered account</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Delivery */}
                        <Card className="gap-0 p-0">
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                                        <Truck className="text-primary size-4" />
                                    </div>
                                    <h3 className="text-foreground font-semibold">Delivery</h3>
                                </div>

                                <div className="space-y-4">
                                    {order.delivery_address ? (
                                        <div className="bg-muted/40 rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs font-medium">Address</p>
                                            <p className="text-foreground text-sm">{order.delivery_address}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/40 rounded-lg p-3 text-center">
                                            <Store className="text-muted-foreground mx-auto mb-2 size-6" />
                                            <p className="text-muted-foreground text-sm">Store Pickup / Walk-in</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-muted/40 rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs font-medium">Expected</p>
                                            <p className="text-foreground text-sm font-semibold">
                                                {order.expected_delivery_date
                                                    ? format(new Date(order.expected_delivery_date), 'MMM d, yyyy')
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-muted/40 rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs font-medium">Actual</p>
                                            <p className="text-foreground text-sm font-semibold">
                                                {order.actual_delivery_date
                                                    ? format(new Date(order.actual_delivery_date), 'MMM d, yyyy')
                                                    : 'Pending'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/40 flex items-center justify-between rounded-lg p-3">
                                        <span className="text-muted-foreground text-xs font-medium">Status</span>
                                        {order.is_delivered ? (
                                            <Badge variant="outline" className="border-success/30 bg-success/10 text-success rounded-full">
                                                <CheckCircle2 className="mr-1 size-3" /> Delivered
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="rounded-full">
                                                <Clock className="mr-1 size-3" /> In Progress
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment */}
                        <Card className="bg-primary text-primary-foreground gap-0 p-0">
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                                            <CreditCard className="size-4" />
                                        </div>
                                        <h3 className="font-semibold">Payment</h3>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'rounded-full border-white/30 bg-white/10 text-primary-foreground px-3',
                                        )}
                                    >
                                        <PaymentStatusIcon className="mr-1 size-3" />
                                        {paymentStatusConfig[order.payment_status]?.label || order.payment_status}
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-bold mb-1">
                                            GHS {order.amount_paid.toFixed(2)}
                                        </p>
                                        <p className="text-primary-foreground/60 flex items-center gap-1 text-xs">
                                            <PaymentMethodIcon className="size-3" />
                                            via {order.payment_method?.replace('_', ' ') || 'N/A'}
                                        </p>
                                    </div>

                                    {order.amount_due > 0 && (
                                        <div className="rounded-lg bg-white/10 p-3">
                                            <p className="text-primary-foreground/60 mb-1 text-xs">Amount Due</p>
                                            <p className="text-warning-foreground text-lg font-bold">
                                                GHS {order.amount_due.toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {order.close_at && (
                                        <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3">
                                            <CalendarClock className="text-primary-foreground/60 size-4" />
                                            <div>
                                                <p className="text-primary-foreground/60 text-xs">Closed at</p>
                                                <p className="text-sm font-medium">
                                                    {format(new Date(order.close_at), 'MMM d, yyyy HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
