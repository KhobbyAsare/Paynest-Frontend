"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Plus, Search, RefreshCcw,
    Download, ArrowUpRight,
    Package, AlertTriangle, XCircle, DollarSign,
    ChevronDown, Filter, Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { GetAllInventory, GetInventoryStatistics } from '@/(api-handlers)/inventoryHandler';
import { InventoryResponse, InventoryStats } from '@/interfaces/inventory';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { getOrganizationShops } from "@/(api-handlers)/organizationShopsHandler";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
    const router = useRouter();
    const [inventory, setInventory] = useState<InventoryResponse[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState<{
        lowStock: boolean;
        outOfStock: boolean;
        needsReorder: boolean;
    }>({
        lowStock: false,
        outOfStock: false,
        needsReorder: false
    });

    const filterRef = useRef<HTMLDivElement>(null);

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

    // Close filter dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchInventoryData = useCallback(async () => {
        setLoading(true);
        try {
            const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const [inventoryData, statsData] = await Promise.all([
                GetAllInventory(filter.lowStock, filter.outOfStock, filter.needsReorder, shopIdParams),
                GetInventoryStatistics(shopIdParams)
            ]);
            setInventory(inventoryData);
            setStats(statsData);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch inventory data');
        } finally {
            setLoading(false);
        }
    }, [filter, selectedShopId]);

    useEffect(() => {
        fetchInventoryData();
    }, [filter, fetchInventoryData]);

    const statsConfig = stats ? [
        {
            name: 'Total Items',
            value: stats.total_items.toString(),
            change: 'Overall',
            changeType: 'neutral',
            icon: <Package className="size-5 text-blue-600" />
        },
        {
            name: 'Low Stock',
            value: stats.low_stock_items.toString(),
            change: stats.low_stock_items > 0 ? 'Action Required' : 'Healthy',
            changeType: stats.low_stock_items > 0 ? 'negative' : 'positive',
            icon: <AlertTriangle className="size-5 text-amber-500" />
        },
        {
            name: 'Out of Stock',
            value: stats.out_of_stock_items.toString(),
            change: stats.out_of_stock_items > 0 ? 'Critical' : 'Healthy',
            changeType: stats.out_of_stock_items > 0 ? 'negative' : 'positive',
            icon: <XCircle className="size-5 text-rose-500" />
        },
        {
            name: 'Inventory Value',
            value: `$${stats.total_inventory_value.toLocaleString()}`,
            change: '+2.5%',
            changeType: 'positive',
            icon: <DollarSign className="size-5 text-emerald-600" />
        },
    ] : [];

    const activeFilterCount = [filter.lowStock, filter.outOfStock, filter.needsReorder].filter(Boolean).length;

    const filteredInventory = inventory.filter(item =>
        (item.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_id.toString().includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Inventory Intelligence"
                description="Monitor stock levels, manage reorders, and optimize your inventory performance."
            >
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="size-4" />
                        Export
                    </Button>
                    <Button
                        onClick={() => router.push('/inventory/create')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="size-4" />
                        Add Inventory
                    </Button>
                </div>
            </PageHeader>

            {/* Stats Grid */}
            <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-200 mt-8 mb-8 overflow-hidden rounded-2xl border border-gray-200 sm:grid-cols-2 lg:grid-cols-4 shadow-sm">
                {statsConfig.map((stat) => (
                    <div
                        key={stat.name}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-8 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            {stat.icon}
                            {stat.name}
                        </dt>
                        <dd
                            className={cn(
                                'text-xs font-semibold',
                                stat.changeType === 'negative' ? 'text-rose-600' :
                                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-gray-500'
                            )}
                        >
                            {stat.change}
                        </dd>
                        <dd className="w-full flex-none text-3xl font-bold tracking-tight text-gray-900 mt-2">
                            {loading ? '...' : stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden p-0">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Search */}
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Search products..."
                                className="pl-9 rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Shop Filter (Admin only) */}
                        {isAdmin && (
                            <div className="w-full md:w-[240px]">
                                <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                                    <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-slate-600">
                                        <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                                        <SelectValue placeholder="All Shops" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-slate-100">
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

                        {/* Filter Dropdown */}
                        <div className="relative" ref={filterRef}>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 rounded-lg"
                                onClick={() => setFilterOpen(prev => !prev)}
                            >
                                <Filter className="size-4" />
                                Stock Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="size-5 p-0 flex items-center justify-center text-[10px]">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                                <ChevronDown className={cn("size-4 transition-transform", filterOpen && "rotate-180")} />
                            </Button>

                            {filterOpen && (
                                <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-md p-2 space-y-1">
                                    {[
                                        { key: 'lowStock' as const, label: 'Low Stock' },
                                        { key: 'outOfStock' as const, label: 'Out of Stock' },
                                        { key: 'needsReorder' as const, label: 'Needs Reorder' },
                                    ].map(({ key, label }) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-50 text-sm text-slate-700 select-none"
                                        >
                                            <Checkbox
                                                checked={filter[key]}
                                                onCheckedChange={() =>
                                                    setFilter(prev => ({ ...prev, [key]: !prev[key] }))
                                                }
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Refresh */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchInventoryData}
                            className="rounded-lg border-slate-200"
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
                            <TableHead className="px-6">Product</TableHead>
                            <TableHead className="px-6">Stock Level</TableHead>
                            <TableHead className="px-6">Location</TableHead>
                            <TableHead className="px-6">Reorder Point</TableHead>
                            <TableHead className="px-6">Status</TableHead>
                            <TableHead className="px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                    <RefreshCcw className="size-5 animate-spin mx-auto mb-2" />
                                    Loading inventory…
                                </TableCell>
                            </TableRow>
                        ) : filteredInventory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                    No inventory items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInventory.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50">
                                    {/* Product */}
                                    <TableCell className="px-6 font-medium text-slate-700">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{item.product_name || 'Unknown Product'}</span>
                                            <span className="text-[10px] text-slate-400 font-mono italic">ID: #{item.product_id}</span>
                                        </div>
                                    </TableCell>

                                    {/* Stock Level */}
                                    <TableCell className="px-6 min-w-[180px]">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm font-semibold">{item.current_stock} units</span>
                                                <div className="flex gap-1">
                                                    {item.is_out_of_stock && (
                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out</Badge>
                                                    )}
                                                    {item.is_low_stock && !item.is_out_of_stock && (
                                                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 hover:bg-amber-500">Low</Badge>
                                                    )}
                                                    {item.needs_reorder && (
                                                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-500 hover:bg-blue-500">Reorder</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full transition-all duration-500',
                                                        item.is_out_of_stock ? 'bg-rose-500 w-0' :
                                                            item.is_low_stock ? 'bg-amber-500' : 'bg-emerald-500'
                                                    )}
                                                    style={{ width: `${Math.min((item.current_stock / (item.maximum_stock || 100)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Location */}
                                    <TableCell className="px-6">
                                        <div className="text-xs text-slate-500">
                                            <div>{item.aisle || 'N/A'} - {item.shelf || 'N/A'}</div>
                                            <div className="font-medium text-slate-700">{item.bin_location || 'No Bin'}</div>
                                        </div>
                                    </TableCell>

                                    {/* Reorder Point */}
                                    <TableCell className="px-6">
                                        <Badge variant="outline" className="rounded-full text-blue-600 border-blue-200 bg-blue-50">
                                            {item.reorder_point} units
                                        </Badge>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="px-6">
                                        <span className="inline-flex items-center gap-1.5 text-sm">
                                            <span className={cn(
                                                "size-2 rounded-full",
                                                item.is_active ? "bg-emerald-500" : "bg-slate-300"
                                            )} />
                                            <span className={item.is_active ? "text-emerald-700" : "text-slate-400"}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </span>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                title="View Details"
                                                onClick={() => router.push(`/inventory/${item.id}`)}
                                            >
                                                <ArrowUpRight className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                title="Adjustment"
                                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            >
                                                <RefreshCcw className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination footer */}
                {!loading && filteredInventory.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Showing {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
                    </div>
                )}
            </Card>
        </div>
    );
}