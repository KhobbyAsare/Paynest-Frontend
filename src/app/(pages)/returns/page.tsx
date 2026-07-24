"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Filter, RefreshCcw, RotateCcw, ShoppingBag } from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { StatusPill } from '@/components/(shared-components)/StatusPill';
import ReturnDetailDialog from '@/components/orders/ReturnDetailDialog';
import { GetReturns } from '@/(api-handlers)/returnsHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { ReturnResponse, ReturnStatus } from '@/interfaces/returns';
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
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

export default function ReturnsPage() {
    const router = useRouter();
    const fmt = useCurrency();
    const { user } = useAuthStore();
    const role = (user?.role || 'attendant').toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const [returns, setReturns] = useState<ReturnResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<ReturnStatus | 'all'>('all');
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    useEffect(() => {
        if (!isAdmin) return;
        getOrganizationShops().then(setShops).catch(console.error);
    }, [isAdmin]);

    const fetchReturns = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await GetReturns({
                status: filterStatus === 'all' ? undefined : filterStatus,
                shop_id: selectedShopId === 'all' ? undefined : Number(selectedShopId),
                skip: (p - 1) * PAGE_SIZE,
                limit: PAGE_SIZE,
            });
            setReturns(data.items);
            setTotal(data.total);
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch returns');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, selectedShopId]);

    useEffect(() => { fetchReturns(page); }, [page, fetchReturns]);

    useEffect(() => { setPage(1); }, [filterStatus, selectedShopId]);

    const openDetail = (id: number) => {
        setSelectedReturnId(id);
        setDetailOpen(true);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Returns"
                description="Review and process return / refund requests."
                actions={
                    <Button variant="outline" size="icon" onClick={() => fetchReturns(page)} disabled={loading} aria-label="Refresh returns">
                        <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                    </Button>
                }
            />

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ReturnStatus | 'all')}>
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
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Return #</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Refund Total</TableHead>
                                <TableHead>Requested At</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7} className="px-6 py-4">
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : returns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-0">
                                        <EmptyState
                                            icon={RotateCcw}
                                            title="No returns found"
                                            description="Return / refund requests will show up here once submitted."
                                            className="border-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                returns.map((ret) => (
                                    <TableRow key={ret.id} className="cursor-pointer" onClick={() => openDetail(ret.id)}>
                                        <TableCell className="pl-6 font-medium">{ret.return_number}</TableCell>
                                        <TableCell>
                                            <button
                                                className="text-primary hover:underline"
                                                onClick={(e) => { e.stopPropagation(); router.push(`/orders/${ret.order_id}`); }}
                                            >
                                                #{ret.order_id}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {ret.requested_by === user?.id ? 'You' : `User #${ret.requested_by}`}
                                        </TableCell>
                                        <TableCell>
                                            <StatusPill status={ret.status === 'requested' ? 'requested' : ret.status} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{fmt(ret.refund_total)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(ret.requested_at), 'MMM d, yyyy · HH:mm')}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                aria-label="View return"
                                                onClick={(e) => { e.stopPropagation(); openDetail(ret.id); }}
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

            <ReturnDetailDialog
                returnId={selectedReturnId}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onDecided={() => fetchReturns(page)}
            />
        </div>
    );
}
