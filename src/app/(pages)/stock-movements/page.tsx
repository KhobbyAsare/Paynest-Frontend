"use client"

import { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCcw, ArrowUpDown, TrendingUp, TrendingDown, Activity, Package } from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { GetStockMovement, GetStockMovementSummary } from '@/(api-handlers)/stockMovementHandler';
import { StockMovementResponse, StockMovementSummary } from '@/interfaces/StockMovements';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const movementTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
    purchase:     { label: 'Purchase',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    sale:         { label: 'Sale',         color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
    return:       { label: 'Return',       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
    adjustment:   { label: 'Adjustment',   color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
    transfer_in:  { label: 'Transfer In',  color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200' },
    transfer_out: { label: 'Transfer Out', color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
    damage:       { label: 'Damage',       color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200' },
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

    useEffect(() => {
        fetchData(page);
    }, [page, fetchData]);

    const statsConfig = summary ? [
        {
            name: 'Total Movements',
            value: summary.total_movements,
            icon: <Activity className="size-5 text-blue-600" />,
        },
        {
            name: 'Net Stock Change',
            value: summary.net_change >= 0 ? `+${summary.net_change}` : `${summary.net_change}`,
            icon: summary.net_change >= 0
                ? <TrendingUp className="size-5 text-emerald-600" />
                : <TrendingDown className="size-5 text-rose-600" />,
        },
        {
            name: 'Purchases',
            value: summary.purchases,
            icon: <Package className="size-5 text-emerald-600" />,
        },
        {
            name: 'Sales',
            value: summary.sales,
            icon: <ArrowUpDown className="size-5 text-blue-600" />,
        },
    ] : [];

    const filtered = movements.filter(m => {
        const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;
        const matchesSearch =
            m.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.reference_type?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Stock Movements"
                description="Track all stock changes including purchases, sales, transfers and adjustments."
            />

            {/* Stats */}
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
                        <dd className="w-full flex-none text-3xl font-bold tracking-tight text-gray-900 mt-2">
                            {loading ? '...' : stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden p-0">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1 flex-wrap">
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Search by reason, product..."
                                className="pl-9 rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-lg">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-100">
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(movementTypeConfig).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchData(page)}
                        className="rounded-lg border-slate-200"
                        title="Refresh"
                    >
                        <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                </div>

                {/* Table */}
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="px-6">Type</TableHead>
                            <TableHead className="px-6">Product</TableHead>
                            <TableHead className="px-6">Qty Change</TableHead>
                            <TableHead className="px-6">Before → After</TableHead>
                            <TableHead className="px-6">Reason</TableHead>
                            <TableHead className="px-6">Reference</TableHead>
                            <TableHead className="px-6">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                    <RefreshCcw className="size-5 animate-spin mx-auto mb-2" />
                                    Loading movements…
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                    No stock movements found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((m) => {
                                const cfg = movementTypeConfig[m.movement_type] ?? { label: m.movement_type, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
                                const isPositive = m.quantity_change > 0;
                                return (
                                    <TableRow key={m.id} className="hover:bg-slate-50/50">
                                        <TableCell className="px-6">
                                            <Badge
                                                variant="outline"
                                                className={cn("text-xs font-semibold rounded-full", cfg.color, cfg.bg)}
                                            >
                                                {cfg.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 text-sm">{m.product_name || 'Unknown Product'}</span>
                                                <span className="font-mono text-[10px] text-slate-400">ID: #{m.product_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <span className={cn(
                                                "font-bold text-sm",
                                                isPositive ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {isPositive ? '+' : ''}{m.quantity_change}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 text-sm text-slate-600">
                                            <span className="font-medium">{m.quantity_before}</span>
                                            <span className="text-slate-400 mx-1">→</span>
                                            <span className="font-medium">{m.quantity_after}</span>
                                        </TableCell>
                                        <TableCell className="px-6 text-sm text-slate-600 max-w-[200px] truncate">
                                            {m.reason || <span className="text-slate-300 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="px-6">
                                            {m.reference_type ? (
                                                <Badge variant="outline" className="text-xs rounded-full text-slate-500 border-slate-200">
                                                    {m.reference_type} #{m.reference_id}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(m.movement_date || m.created_at).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {!loading && filtered.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Showing {filtered.length} movement{filtered.length !== 1 ? 's' : ''} on this page
                    </div>
                )}
            </Card>

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
                total={total}
            />
        </div>
    );
}
