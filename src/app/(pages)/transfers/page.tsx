"use client"

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Eye, Filter, Plus, RefreshCcw, ShoppingBag } from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { StatusPill } from '@/components/(shared-components)/StatusPill';
import NewTransferDialog from '@/components/inventory/NewTransferDialog';
import TransferDetailDialog from '@/components/inventory/TransferDetailDialog';
import { GetTransfers } from '@/(api-handlers)/inventoryTransfersHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { TransferResponse, TransferStatus } from '@/interfaces/inventoryTransfers';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

export default function TransfersPage() {
    const { user } = useAuthStore();

    const [transfers, setTransfers] = useState<TransferResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<TransferStatus | 'all'>('all');
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [newTransferOpen, setNewTransferOpen] = useState(false);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const shopName = (id: number) => shops.find((s) => s.id === id)?.name || `Shop #${id}`;

    useEffect(() => {
        getOrganizationShops().then(setShops).catch(console.error);
    }, []);

    const fetchTransfers = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await GetTransfers({
                status: filterStatus === 'all' ? undefined : filterStatus,
                source_shop_id: selectedShopId === 'all' ? undefined : Number(selectedShopId),
                skip: (p - 1) * PAGE_SIZE,
                limit: PAGE_SIZE,
            });
            setTransfers(data.items);
            setTotal(data.total);
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch transfers');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, selectedShopId]);

    useEffect(() => { fetchTransfers(page); }, [page, fetchTransfers]);

    useEffect(() => { setPage(1); }, [filterStatus, selectedShopId]);

    const openDetail = (id: number) => {
        setSelectedTransferId(id);
        setDetailOpen(true);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Transfers"
                description="Move stock between shops."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => fetchTransfers(page)} disabled={loading} aria-label="Refresh transfers">
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                        <Button onClick={() => setNewTransferOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            New Transfer
                        </Button>
                    </div>
                }
            />

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as TransferStatus | 'all')}>
                            <SelectTrigger className="h-9 w-[160px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="All statuses" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="requested">Requested</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                            <SelectTrigger className="h-9 w-[170px]">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="All shops" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All shops (source)</SelectItem>
                                {shops.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Transfer #</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Requested At</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6} className="px-6 py-4">
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : transfers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                        <EmptyState
                                            icon={ArrowLeftRight}
                                            title="No transfers found"
                                            description="Stock transfer requests will show up here once submitted."
                                            actions={<Button onClick={() => setNewTransferOpen(true)}>New Transfer</Button>}
                                            className="border-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transfers.map((tr) => (
                                    <TableRow key={tr.id} className="cursor-pointer" onClick={() => openDetail(tr.id)}>
                                        <TableCell className="pl-6 font-medium">{tr.transfer_number}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span>{shopName(tr.source_shop_id)}</span>
                                                <ArrowRight className="text-muted-foreground size-3.5" />
                                                <span>{shopName(tr.destination_shop_id)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {tr.requested_by === user?.id ? 'You' : `User #${tr.requested_by}`}
                                        </TableCell>
                                        <TableCell>
                                            <StatusPill status={tr.status} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(tr.requested_at), 'MMM d, yyyy · HH:mm')}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                aria-label="View transfer"
                                                onClick={(e) => { e.stopPropagation(); openDetail(tr.id); }}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={total} />

            <NewTransferDialog
                shops={shops}
                open={newTransferOpen}
                onOpenChange={setNewTransferOpen}
                onSuccess={() => fetchTransfers(page)}
            />
            <TransferDetailDialog
                transferId={selectedTransferId}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onChanged={() => fetchTransfers(page)}
            />
        </div>
    );
}
