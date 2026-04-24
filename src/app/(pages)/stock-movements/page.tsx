"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    Search, RefreshCcw, ArrowUpDown, TrendingUp, TrendingDown, Activity, Package,
} from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { StatCard } from '@/components/(shared-components)/StatCard';
import { GetStockMovement, GetStockMovementSummary } from '@/(api-handlers)/stockMovementHandler';
import { StockMovementResponse, StockMovementSummary } from '@/interfaces/StockMovements';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const movementTypeConfig: Record<string, { label: string; className: string }> = {
    purchase:     { label: 'Purchase',     className: 'border-success/30 bg-success/10 text-success' },
    sale:         { label: 'Sale',         className: 'border-info/30 bg-info/10 text-info' },
    return:       { label: 'Return',       className: 'border-warning/30 bg-warning/10 text-warning-foreground' },
    adjustment:   { label: 'Adjustment',   className: 'border-primary/30 bg-primary/10 text-primary' },
    transfer_in:  { label: 'Transfer In',  className: 'border-success/30 bg-success/10 text-success' },
    transfer_out: { label: 'Transfer Out', className: 'border-warning/30 bg-warning/10 text-warning-foreground' },
    damage:       { label: 'Damage',       className: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

const PAGE_SIZE = 50;

export default function StockMovementsPage() {
    const [movements, setMovements] = useState<StockMovementResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [summary, setSummary] = useState<StockMovementSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchData = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const [movData, sumData] = await Promise.all([
                GetStockMovement((p - 1) * PAGE_SIZE, PAGE_SIZE),
                GetStockMovementSummary(),
            ]);
            setMovements(movData.items);
            setTotal(movData.total);
            setSummary(sumData);
        } catch (error: unknown) {
            handleErrorMessage(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(page); }, [page, fetchData]);

    const filtered = movements.filter(m => {
        const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;
        const matchesSearch =
            m.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.reference_type?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const netPositive = (summary?.net_change ?? 0) >= 0;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Stock Movements"
                description="Track all stock changes including purchases, sales, transfers and adjustments."
            />

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total Movements"
                    value={summary ? summary.total_movements.toLocaleString() : '0'}
                    icon={Activity}
                    trend={{ direction: 'neutral', label: 'all time' }}
                    loading={loading}
                />
                <StatCard
                    label="Net Stock Change"
                    value={summary ? (netPositive ? `+${summary.net_change}` : `${summary.net_change}`) : '0'}
                    icon={netPositive ? TrendingUp : TrendingDown}
                    trend={{
                        direction: netPositive ? 'up' : 'down',
                        label: netPositive ? 'net gain' : 'net loss',
                    }}
                    loading={loading}
                />
                <StatCard
                    label="Purchases"
                    value={summary ? summary.purchases.toLocaleString() : '0'}
                    icon={Package}
                    trend={{ direction: 'up', label: 'stock in' }}
                    loading={loading}
                />
                <StatCard
                    label="Sales"
                    value={summary ? summary.sales.toLocaleString() : '0'}
                    icon={ArrowUpDown}
                    trend={{ direction: 'neutral', label: 'stock out' }}
                    loading={loading}
                />
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search by product, reason…"
                            className="h-9 pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-9 w-[160px]">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {Object.entries(movementTypeConfig).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" className="size-9" onClick={() => fetchData(page)} title="Refresh">
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Type</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Qty change</TableHead>
                                <TableHead>Before → After</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="pr-6">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Activity className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No stock movements found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(m => {
                                const cfg = movementTypeConfig[m.movement_type] ?? {
                                    label: m.movement_type,
                                    className: 'border-border bg-muted text-muted-foreground',
                                };
                                const isPositive = m.quantity_change > 0;
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell className="pl-6">
                                            <Badge variant="outline" className={cn('rounded-full text-xs font-semibold', cfg.className)}>
                                                {cfg.label}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <p className="text-foreground text-sm font-semibold">{m.product_name || 'Unknown'}</p>
                                            <p className="text-muted-foreground font-mono text-[10px]">ID #{m.product_id}</p>
                                        </TableCell>

                                        <TableCell>
                                            <span className={cn(
                                                'num-tabular text-sm font-bold',
                                                isPositive ? 'text-success' : 'text-destructive',
                                            )}>
                                                {isPositive ? '+' : ''}{m.quantity_change}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <span className="text-foreground num-tabular text-sm font-medium">{m.quantity_before}</span>
                                            <span className="text-muted-foreground mx-1.5">→</span>
                                            <span className="text-foreground num-tabular text-sm font-medium">{m.quantity_after}</span>
                                        </TableCell>

                                        <TableCell className="max-w-[180px] truncate">
                                            <span className="text-muted-foreground text-sm">
                                                {m.reason || <em className="text-muted-foreground/50">—</em>}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            {m.reference_type ? (
                                                <Badge variant="outline" className="rounded-full text-xs">
                                                    {m.reference_type} #{m.reference_id}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="pr-6 text-xs whitespace-nowrap">
                                            <span className="text-foreground font-medium">
                                                {new Date(m.movement_date || m.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="border-border bg-muted/30 border-t px-6 py-3 text-xs">
                        <span className="text-muted-foreground">
                            {filtered.length} movement{filtered.length !== 1 ? 's' : ''} on this page
                        </span>
                    </div>
                )}
            </Card>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={total} />
        </div>
    );
}
