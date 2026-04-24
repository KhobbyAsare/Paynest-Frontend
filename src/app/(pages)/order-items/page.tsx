/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Plus, MoreHorizontal, Pencil, Trash2, Search,
    RefreshCcw, ShoppingCart, FilterX, Package, ShoppingBag, AlertTriangle,
} from 'lucide-react';
import {
    GetOrderItems, GetAllOrderItems, CreateOrderItems,
    UpdateOrderItems, DeleteOrderItems,
} from '@/(api-handlers)/orderItemsHandler';
import { GetProducts } from '@/(api-handlers)/productsHandler';
import { GetWalkinOrdersList } from '@/(api-handlers)/orders_walkinsHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { OrderItemResponse, OrderItemRequest, UpdateOrderItemRequest } from '@/interfaces/orderItems';
import { ProductResponse } from '@/interfaces/products';
import { OrderWalkInsResponse } from '@/interfaces/orders_walkins';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { toast } from 'sonner';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ItemFormValues {
    target_order_id: string;
    product_id: string;
    quantity: string;
    quantity_cancelled: string;
    unit_price: string;
    tax_rate: string;
    discount_percentage: string;
    inventory_id: string;
    item_status: string;
    notes: string;
}

function statusBadgeClass(status: string) {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'delivered':  return 'border-success/30 bg-success/10 text-success';
        case 'cancelled':  return 'border-destructive/30 bg-destructive/10 text-destructive';
        case 'processing': return 'border-info/30 bg-info/10 text-info';
        default:           return 'border-warning/30 bg-warning/10 text-warning-foreground';
    }
}

export default function OrderItemsPage() {
    const [orderItems, setOrderItems]         = useState<OrderItemResponse[]>([]);
    const [products, setProducts]             = useState<ProductResponse[]>([]);
    const [orders, setOrders]                 = useState<OrderWalkInsResponse[]>([]);
    const [loading, setLoading]               = useState(true);
    const [searchTerm, setSearchTerm]         = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchOrderId, setSearchOrderId]   = useState('');
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editingItem, setEditingItem]       = useState<OrderItemResponse | null>(null);
    const [submitting, setSubmitting]         = useState(false);
    const [deleteTarget, setDeleteTarget]     = useState<OrderItemResponse | null>(null);
    const [deleting, setDeleting]             = useState(false);

    const { user } = useAuthStore();
    const [shops, setShops]                   = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const isAdmin = ['admin', 'superadmin'].includes((user?.role ?? '').toLowerCase());

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ItemFormValues>({
        defaultValues: { quantity: '1', quantity_cancelled: '0', tax_rate: '0', discount_percentage: '0', item_status: 'pending' },
    });

    useEffect(() => {
        if (!isAdmin) return;
        getOrganizationShops().then(setShops).catch(console.error);
    }, [isAdmin]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const shopId = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const [prodsData, ordersData]: [any, any] = await Promise.all([
                GetProducts(shopId),
                GetWalkinOrdersList(shopId),
            ]);
            setProducts(prodsData);
            setOrders(ordersData.items ?? []);

            if (searchOrderId && !isNaN(Number(searchOrderId))) {
                const items = await GetOrderItems(Number(searchOrderId));
                setOrderItems(items);
            } else {
                const items = await GetAllOrderItems(shopId);
                setOrderItems(items);
            }
        } catch (error) {
            handleErrorMessage(error, 'Failed to load order items');
        } finally {
            setLoading(false);
        }
    }, [searchOrderId, selectedShopId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openModal = (item: OrderItemResponse | null = null) => {
        setEditingItem(item);
        if (item) {
            reset({
                quantity:            item.quantity?.toString() ?? '1',
                quantity_cancelled:  item.quantity_cancelled?.toString() ?? '0',
                unit_price:          item.unit_price?.toString() ?? '',
                tax_rate:            item.tax_rate?.toString() ?? '0',
                discount_percentage: item.discount_percentage?.toString() ?? '0',
                inventory_id:        item.inventory_id?.toString() ?? '',
                item_status:         item.item_status ?? 'pending',
                notes:               item.notes ?? '',
            });
        } else {
            reset({ quantity: '1', quantity_cancelled: '0', tax_rate: '0', discount_percentage: '0', item_status: 'pending' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        reset();
    };

    const onSubmit = async (values: ItemFormValues) => {
        setSubmitting(true);
        try {
            if (editingItem) {
                const data: UpdateOrderItemRequest = {
                    quantity:            Number(values.quantity),
                    quantity_cancelled:  Number(values.quantity_cancelled || 0),
                    inventory_id:        values.inventory_id ? Number(values.inventory_id) : undefined,
                    unit_price:          values.unit_price ? Number(values.unit_price) : undefined,
                    tax_rate:            values.tax_rate !== '' ? Number(values.tax_rate) : undefined,
                    discount_percentage: values.discount_percentage !== '' ? Number(values.discount_percentage) : undefined,
                    notes:               values.notes || '',
                    item_status:         values.item_status || 'pending',
                };
                await UpdateOrderItems(editingItem.id, data);
                toast.success('Order item updated');
            } else {
                const data: OrderItemRequest = {
                    product_id:          Number(values.product_id),
                    quantity:            Number(values.quantity),
                    inventory_id:        values.inventory_id ? Number(values.inventory_id) : undefined,
                    unit_price:          values.unit_price ? Number(values.unit_price) : undefined,
                    tax_rate:            values.tax_rate !== '' ? Number(values.tax_rate) : undefined,
                    discount_percentage: values.discount_percentage !== '' ? Number(values.discount_percentage) : undefined,
                    notes:               values.notes || '',
                };
                await CreateOrderItems(data, Number(values.target_order_id));
                toast.success('Order item created');
            }
            closeModal();
            fetchData();
        } catch (error) {
            handleErrorMessage(error, editingItem ? 'Failed to update item' : 'Failed to create item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await DeleteOrderItems(deleteTarget.id);
            toast.success('Order item deleted');
            setDeleteTarget(null);
            fetchData();
        } catch (error) {
            handleErrorMessage(error, 'Failed to delete item');
        } finally {
            setDeleting(false);
        }
    };

    const hasFilters = searchTerm !== '' || selectedStatus !== 'all' || searchOrderId !== '' || selectedShopId !== 'all';

    const filtered = orderItems.filter(item => {
        const ms = item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.order_id?.toString().includes(searchTerm);
        const mf = selectedStatus === 'all' || item.item_status?.toLowerCase() === selectedStatus;
        return ms && mf;
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Order Items"
                description="Manage individual items across all orders."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                        <Button onClick={() => openModal()}>
                            <Plus data-icon="inline-start" /> Add Item
                        </Button>
                    </div>
                }
            />

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
                    {/* Order ID filter */}
                    <div className="relative w-[160px]">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                        <Input
                            type="number"
                            placeholder="Order ID…"
                            className="h-9 pl-8"
                            value={searchOrderId}
                            onChange={e => setSearchOrderId(e.target.value)}
                        />
                    </div>

                    {/* Product search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search product, SKU…"
                            className="h-9 pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="h-9 w-[140px]">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        {isAdmin && (
                            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
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

                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-muted-foreground"
                                onClick={() => { setSearchTerm(''); setSelectedStatus('all'); setSearchOrderId(''); setSelectedShopId('all'); }}
                            >
                                <FilterX className="mr-1.5 size-3.5" /> Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Order</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Inv. ID</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead className="text-right">Unit price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <ShoppingCart className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No order items found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="pl-6">
                                        <p className="text-foreground font-bold">#{item.order_number || item.order_id}</p>
                                        <p className="text-muted-foreground font-mono text-[10px]">ID {item.order_id}</p>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
                                                <Package className="size-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-foreground text-sm font-medium">{item.product_name}</p>
                                                <p className="text-muted-foreground font-mono text-[10px]">{item.product_sku}</p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <span className="text-muted-foreground font-mono text-xs">{item.inventory_id || '—'}</span>
                                    </TableCell>

                                    <TableCell>
                                        <p className="text-foreground num-tabular font-semibold">{item.quantity}</p>
                                        {item.quantity_cancelled > 0 && (
                                            <p className="text-destructive text-xs">−{item.quantity_cancelled} cancelled</p>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span className="text-foreground num-tabular text-sm">
                                            GHS {Number(item.unit_price).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span className="text-foreground num-tabular font-semibold">
                                            GHS {Number(item.total_amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('rounded-full text-xs font-medium capitalize', statusBadgeClass(item.item_status))}
                                        >
                                            {item.item_status || 'pending'}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <span className="text-muted-foreground text-xs">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </TableCell>

                                    <TableCell className="pr-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => openModal(item)}>
                                                    <Pencil className="size-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeleteTarget(item)}
                                                >
                                                    <Trash2 className="size-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="border-border bg-muted/30 border-t px-6 py-3 text-xs">
                        <span className="text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </Card>

            {/* Create / Edit dialog */}
            <Dialog open={isModalOpen} onOpenChange={open => !open && closeModal()}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="bg-primary/10 mb-1 inline-flex size-10 items-center justify-center rounded-xl">
                            {editingItem ? <Pencil className="text-primary size-5" /> : <Plus className="text-primary size-5" />}
                        </div>
                        <DialogTitle>{editingItem ? 'Edit Order Item' : 'Add Order Item'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
                        <p className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <ShoppingCart className="size-3.5" /> Item details
                        </p>

                        {/* Order + Product selects (create only) */}
                        {!editingItem && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Order <span className="text-destructive">*</span></Label>
                                    <Controller
                                        control={control}
                                        name="target_order_id"
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className={cn('h-9', errors.target_order_id && 'border-destructive')}>
                                                    <SelectValue placeholder="Select order…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {orders.map(o => (
                                                        <SelectItem key={o.id} value={o.id.toString()}>
                                                            #{o.order_number || o.id} — {o.order_status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Product <span className="text-destructive">*</span></Label>
                                    <Controller
                                        control={control}
                                        name="product_id"
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className={cn('h-9', errors.product_id && 'border-destructive')}>
                                                    <SelectValue placeholder="Select product…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.name} — GHS {p.selling_price}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Qty + unit price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Quantity <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="1"
                                    className="h-9"
                                    {...register('quantity', { required: true, min: 1 })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Unit price (override)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="h-9"
                                    placeholder="Use product price…"
                                    {...register('unit_price')}
                                />
                            </div>
                        </div>

                        {/* Tax + discount */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Tax rate %</Label>
                                <Input type="number" step="0.01" min="0" max="100" className="h-9" {...register('tax_rate')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Discount %</Label>
                                <Input type="number" step="0.01" min="0" max="100" className="h-9" {...register('discount_percentage')} />
                            </div>
                        </div>

                        {/* Inventory ID + status (edit) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Inventory ID</Label>
                                <Input type="number" min="1" className="h-9" placeholder="Optional…" {...register('inventory_id')} />
                            </div>
                            {editingItem && (
                                <div className="space-y-1.5">
                                    <Label>Status</Label>
                                    <Controller
                                        control={control}
                                        name="item_status"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="processing">Processing</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="delivered">Delivered</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Qty cancelled (edit only) */}
                        {editingItem && (
                            <div className="space-y-1.5">
                                <Label>Quantity cancelled</Label>
                                <Input type="number" min="0" className="h-9" {...register('quantity_cancelled')} />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea
                                className="resize-none"
                                rows={3}
                                placeholder="Special instructions…"
                                {...register('notes')}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving…' : (editingItem ? 'Update Item' : 'Add Item')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="bg-destructive/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                            <AlertTriangle className="text-destructive size-6" />
                        </div>
                        <AlertDialogTitle>Delete order item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This item from order <strong>#{deleteTarget?.order_id}</strong> will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
