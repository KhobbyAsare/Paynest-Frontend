"use client"

import { useEffect, useState, useCallback } from 'react';
import {
    Search, Edit, Trash2,
    Mail, Phone, MapPin,
    Download, Filter, RefreshCcw,
    UserPlus, Star, AlertTriangle, ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GetAllCustomers, DeleteCustomer } from '@/(api-handlers)/customersHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { CustomerResponse } from '@/interfaces/customers';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import EmptyState from '@/components/(shared-components)/EmptyState';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Inline confirm dialog (replaces antd Modal.confirm)                        */
/* -------------------------------------------------------------------------- */
interface ConfirmDialog {
    open: boolean;
    customerId: number | null;
    customerName: string;
}

function getTierStyle(tier: string) {
    switch (tier?.toLowerCase()) {
        case 'gold':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'silver':
            return 'bg-slate-100 text-slate-600 border-slate-200';
        case 'platinum':
            return 'bg-violet-50 text-violet-700 border-violet-200';
        default:
            return 'bg-blue-50 text-blue-600 border-blue-200';
    }
}

function CustomerAvatar({ firstName, lastName }: Readonly<{ firstName: string; lastName: string }>) {
    const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
    return (
        <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
        </div>
    );
}

export default function CustomerListPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<CustomerResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [deleting, setDeleting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
        open: false,
        customerId: null,
        customerName: '',
    });

    // Shop filtering
    const { user } = useAuthStore();
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("all");
    const role = (user?.role || "attendant").toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const fetchShops = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const data = await getOrganizationShops();
            setShops(data);
        } catch (error) {
            console.error("Failed to fetch shops:", error);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const data = await GetAllCustomers(shopIdParams);
            setCustomers(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    }, [selectedShopId]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    function openDeleteConfirm(id: number, name: string) {
        setConfirmDialog({ open: true, customerId: id, customerName: name });
    }

    function closeDeleteConfirm() {
        setConfirmDialog({ open: false, customerId: null, customerName: '' });
    }

    async function handleConfirmDelete() {
        if (!confirmDialog.customerId) return;
        setDeleting(true);
        try {
            await DeleteCustomer(confirmDialog.customerId);
            toast.success('Customer deleted successfully');
            closeDeleteConfirm();
            fetchCustomers();
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to delete customer');
        } finally {
            setDeleting(false);
        }
    }

    const filteredCustomers = customers.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* ------------------------------------------------------------------ */
    /*  Resolved table body content (avoids nested ternary in JSX)        */
    /* ------------------------------------------------------------------ */
    let tableBodyContent: React.ReactNode;
    if (loading) {
        tableBodyContent = (
            <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                    <RefreshCcw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-400">Loading customers…</p>
                </TableCell>
            </TableRow>
        );
    } else if (filteredCustomers.length === 0) {
        tableBodyContent = (
            <TableRow>
                <TableCell colSpan={6}>
                    <EmptyState
                        title={searchTerm ? "No customers found" : "No customers yet"}
                        description={
                            searchTerm
                                ? `We couldn't find any customers matching "${searchTerm}"`
                                : "Your customer list is empty. Start by adding your first customer."
                        }
                        actionText={searchTerm ? "Clear Search" : "Add Customer"}
                        onAction={searchTerm ? () => setSearchTerm('') : () => router.push('/customers/create')}
                    />
                </TableCell>
            </TableRow>
        );
    } else {
        tableBodyContent = filteredCustomers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-slate-50/60">
                {/* Customer */}
                <TableCell className="px-6">
                    <div className="flex items-center gap-3">
                        <CustomerAvatar
                            firstName={customer.first_name}
                            lastName={customer.last_name}
                        />
                        <div>
                            <div className="font-bold text-slate-900 leading-tight">
                                {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                                {customer.customer_code}
                            </div>
                        </div>
                    </div>
                </TableCell>

                {/* Contact */}
                <TableCell className="px-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="size-3 shrink-0" />
                            {customer.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="size-3 shrink-0" />
                            {customer.phone}
                        </div>
                    </div>
                </TableCell>

                {/* Location */}
                <TableCell className="px-6">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="size-3 shrink-0" />
                        {[customer.city, customer.country].filter(Boolean).join(', ') || '—'}
                    </div>
                </TableCell>

                {/* Tier & Points */}
                <TableCell className="px-6">
                    <div className="space-y-1.5">
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full font-bold uppercase text-[10px] px-2",
                                getTierStyle(customer.loyalty_tier)
                            )}
                        >
                            {customer.loyalty_tier || 'Standard'}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                            <Star className="size-3 text-amber-500 fill-amber-500" />
                            {customer.loyalty_points.toLocaleString()} pts
                        </div>
                    </div>
                </TableCell>

                {/* Status */}
                <TableCell className="px-6">
                    <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={cn(
                            "size-2 rounded-full",
                            customer.is_active ? "bg-emerald-500" : "bg-slate-300"
                        )} />
                        <span className={customer.is_active ? "text-emerald-700" : "text-slate-400"}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="px-6">
                    <div className="flex items-center gap-1">
                        <Link href={`/customers/edit/${customer.id}`}>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Edit Customer"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Edit className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete Customer"
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => openDeleteConfirm(
                                customer.id,
                                `${customer.first_name} ${customer.last_name}`
                            )}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        ));
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Customer Relations"
                description="Manage your client base, loyalty programs, and communication preferences."
            >
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2 h-10 px-6 rounded-md border-slate-200">
                        <Download className="size-4" />
                        Export
                    </Button>
                    <Button
                        onClick={() => router.push('/customers/create')}
                        className="flex items-center gap-2 h-10 px-8 rounded-md shadow-lg shadow-blue-100 font-medium"
                    >
                        <UserPlus className="size-4" />
                        Add Customer
                    </Button>
                </div>
            </PageHeader>

            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden mt-8 p-0">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Search by name, email or code..."
                                className="pl-9 h-11 rounded-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-11 px-4 rounded-md shrink-0">
                            <Filter className="size-4" />
                            Filters
                        </Button>

                        {isAdmin && (
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                                <Select
                                    value={selectedShopId}
                                    onValueChange={(val) => setSelectedShopId(val)}
                                >
                                    <SelectTrigger className="h-10 w-[200px] border-slate-200 bg-white rounded-[8px]">
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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchCustomers}
                            className="h-11 w-11 rounded-xl border-slate-200"
                            title="Refresh"
                        >
                            <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="px-6">Customer</TableHead>
                            <TableHead className="px-6">Contact</TableHead>
                            <TableHead className="px-6">Location</TableHead>
                            <TableHead className="px-6">Tier & Points</TableHead>
                            <TableHead className="px-6">Status</TableHead>
                            <TableHead className="px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableBodyContent}
                    </TableBody>
                </Table>

                {/* Row count footer */}
                {!loading && filteredCustomers.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Showing {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                    </div>
                )}
            </Card>

            {/* ---------------------------------------------------------------- */}
            {/* Delete Confirm Dialog                                             */}
            {/* ---------------------------------------------------------------- */}
            {confirmDialog.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeDeleteConfirm}
                    />
                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="size-5 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-base">Delete Customer</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Are you sure you want to delete{' '}
                                    <strong className="text-slate-700">{confirmDialog.customerName}</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={closeDeleteConfirm}
                                disabled={deleting}
                                className="rounded-xl"
                            >
                                No, Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="rounded-xl"
                            >
                                {deleting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="size-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Deleting…
                                    </span>
                                ) : 'Yes, Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}