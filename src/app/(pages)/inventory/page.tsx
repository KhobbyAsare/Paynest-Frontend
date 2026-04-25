"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    Plus, Search, RefreshCcw, ArrowUpRight,
    Package, AlertTriangle, XCircle, DollarSign, Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { StatCard } from '@/components/(shared-components)/StatCard';
import { StatusPill } from '@/components/(shared-components)/StatusPill';
import { GetAllInventory, GetInventoryStatistics } from '@/(api-handlers)/inventoryHandler';
import { InventoryResponse, InventoryStats } from '@/interfaces/inventory';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
    const router = useRouter();
    const [inventory, setInventory] = useState<InventoryResponse[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState({ lowStock: false, outOfStock: false, needsReorder: false });

    const { user } = useAuthStore();
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const isAdmin = ['admin', 'superadmin'].includes((user?.role ?? '').toLowerCase());

    useEffect(() => {
        if (!isAdmin) return;
        getOrganizationShops().then(setShops).catch(console.error);
    }, [isAdmin]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const shopId = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const [inv, st] = await Promise.all([
                GetAllInventory(filter.lowStock, filter.outOfStock, filter.needsReorder, shopId),
                GetInventoryStatistics(shopId),
            ]);
            setInventory(inv);
            setStats(st);
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    }, [filter, selectedShopId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = inventory.filter(item =>
        (item.product_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_id.toString().includes(searchTerm)
    );

    const activeFilterCount = Object.values(filter).filter(Boolean).length;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Inventory"
                description="Monitor stock levels, manage reorders, and optimise inventory performance."
                actions={
                    <div className="flex gap-2">
                        <Button onClick={() => router.push('/inventory/create')}>
                            <Plus data-icon="inline-start" /> Add Inventory
                        </Button>
                    </div>
                }
            />

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total Items"
                    value={stats ? stats.total_items.toLocaleString() : '0'}
                    icon={Package}
                    trend={{ direction: 'neutral', label: 'in catalogue' }}
                    loading={loading}
                />
                <StatCard
                    label="Low Stock"
                    value={stats ? stats.low_stock_items.toLocaleString() : '0'}
                    sub={stats ? `${stats.needs_reorder_items} need reorder` : undefined}
                    icon={AlertTriangle}
                    trend={{
                        direction: (stats?.low_stock_items ?? 0) > 0 ? 'down' : 'up',
                        label: (stats?.low_stock_items ?? 0) > 0 ? 'action required' : 'healthy',
                    }}
                    loading={loading}
                />
                <StatCard
                    label="Out of Stock"
                    value={stats ? stats.out_of_stock_items.toLocaleString() : '0'}
                    icon={XCircle}
                    trend={{
                        direction: (stats?.out_of_stock_items ?? 0) > 0 ? 'down' : 'up',
                        label: (stats?.out_of_stock_items ?? 0) > 0 ? 'critical' : 'all stocked',
                    }}
                    loading={loading}
                />
                <StatCard
                    label="Inventory Value"
                    value={stats ? `GHS ${stats.total_inventory_value.toLocaleString('en-GH', { minimumFractionDigits: 2 })}` : 'GHS 0'}
                    icon={DollarSign}
                    trend={{ direction: 'neutral', label: 'at cost price' }}
                    loading={loading}
                />
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search products…"
                            className="h-9 pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Stock filter chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        {([
                            { key: 'lowStock' as const, label: 'Low stock' },
                            { key: 'outOfStock' as const, label: 'Out of stock' },
                            { key: 'needsReorder' as const, label: 'Needs reorder' },
                        ]).map(({ key, label }) => (
                            <label
                                key={key}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                    filter[key]
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border bg-card hover:bg-accent',
                                )}
                            >
                                <Checkbox
                                    checked={filter[key]}
                                    onCheckedChange={() => setFilter(p => ({ ...p, [key]: !p[key] }))}
                                    className="sr-only"
                                />
                                {label}
                                {filter[key] && activeFilterCount > 0 && ' ✓'}
                            </label>
                        ))}

                        {isAdmin && (
                            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                                <SelectTrigger className="h-9 w-[160px]">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="text-muted-foreground size-3.5" />
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

                        <Button variant="outline" size="icon" className="size-9" onClick={fetchData} aria-label="Refresh inventory">
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Product</TableHead>
                                <TableHead className="min-w-[180px]">Stock level</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Reorder point</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Package className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No inventory items found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="pl-6">
                                        <p className="text-foreground font-semibold">{item.product_name ?? 'Unknown'}</p>
                                        <p className="text-muted-foreground font-mono text-[10px]">ID #{item.product_id}</p>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-foreground num-tabular text-sm font-semibold">
                                                    {item.current_stock} units
                                                </span>
                                                <div className="flex gap-1">
                                                    {item.is_out_of_stock && <StatusPill status="failed" label="Out" showIcon={false} />}
                                                    {item.is_low_stock && !item.is_out_of_stock && <StatusPill status="warning" label="Low" showIcon={false} />}
                                                    {item.needs_reorder && <StatusPill status="info" label="Reorder" showIcon={false} />}
                                                </div>
                                            </div>
                                            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                                <div
                                                    className={cn(
                                                        'h-full transition-all duration-500',
                                                        item.is_out_of_stock ? 'bg-destructive w-0'
                                                            : item.is_low_stock ? 'bg-warning'
                                                                : 'bg-success',
                                                    )}
                                                    style={{ width: `${Math.min((item.current_stock / (item.maximum_stock || 100)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <p className="text-foreground text-xs font-medium">{item.aisle || 'N/A'} — {item.shelf || 'N/A'}</p>
                                        <p className="text-muted-foreground text-xs">{item.bin_location || 'No bin'}</p>
                                    </TableCell>

                                    <TableCell>
                                        <Badge variant="outline" className="border-info/30 bg-info/10 text-info rounded-full font-semibold">
                                            {item.reorder_point} units
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <StatusPill status={item.is_active ? 'active' : 'inactive'} />
                                    </TableCell>

                                    <TableCell className="pr-6 text-right">
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push(`/inventory/${item.id}`)}>
                                            <ArrowUpRight className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="border-border bg-muted/30 border-t px-6 py-3 text-xs">
                        <span className="text-muted-foreground">
                            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </Card>
        </div>
    );
}
