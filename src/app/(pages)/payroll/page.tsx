"use client"

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { createPayrollRun, getPayrollRuns } from '@/(api-handlers)/payrollHandler';
import { PayrollRun, PayrollRunStatus } from '@/interfaces/payroll';
import { handleErrorMessage, getErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Plus, Eye, RefreshCcw, ReceiptText,
    Clock, FileSearch, CheckCircle2, PlayCircle, XCircle,
} from 'lucide-react';
import { DatePicker } from 'antd';
import { type Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG: Record<PayrollRunStatus, { label: string; cls: string; icon: React.ElementType }> = {
    draft:     { label: 'Draft',     cls: 'border-border bg-muted text-muted-foreground', icon: Clock },
    review:    { label: 'In Review', cls: 'border-warning/30 bg-warning/10 text-warning-foreground', icon: FileSearch },
    approved:  { label: 'Approved',  cls: 'border-info/30 bg-info/10 text-info', icon: CheckCircle2 },
    processed: { label: 'Processed', cls: 'border-success/30 bg-success/10 text-success', icon: PlayCircle },
    rejected:  { label: 'Rejected',  cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
};

function StatusBadge({ status }: { status: PayrollRunStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={cn('rounded-full text-xs', cfg.cls)}>
            <Icon className="mr-1 size-3" /> {cfg.label}
        </Badge>
    );
}

export default function PayrollRunsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const fmt = useCurrency();

    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<{ range: [Dayjs, Dayjs] | null; payDate: Dayjs | null; notes: string }>({
        range: null, payDate: null, notes: '',
    });

    useEffect(() => {
        if (user && user.role !== 'admin') router.replace('/dashboard');
    }, [user, router]);

    const fetchRuns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPayrollRuns((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
            setRuns(res.items);
            setTotal(res.total);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load payroll runs');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => { fetchRuns(); }, [fetchRuns]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.range || !form.payDate) { toast.error('Pick a period and pay date'); return; }
        setCreating(true);
        try {
            const run = await createPayrollRun({
                period_start: form.range[0].format('YYYY-MM-DD'),
                period_end: form.range[1].format('YYYY-MM-DD'),
                pay_date: form.payDate.format('YYYY-MM-DD'),
                notes: form.notes || undefined,
            });
            toast.success(`Payroll run ${run.run_number} ready`);
            setIsCreateOpen(false);
            setForm({ range: null, payDate: null, notes: '' });
            router.push(`/payroll/${run.id}`);
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to run payroll');
            if (/tax config/i.test(message)) {
                toast.error(message, {
                    action: { label: 'Go to Payroll Settings', onClick: () => router.push('/settings/payroll') },
                });
            } else {
                toast.error(message);
            }
        } finally {
            setCreating(false);
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center py-24">
                <Skeleton className="size-6 rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Payroll Runs"
                description="Create, review, and process payroll for each pay period."
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="icon" className="size-9" onClick={fetchRuns} disabled={loading} aria-label="Refresh runs">
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 size-4" /> Run Payroll
                        </Button>
                    </div>
                }
            />

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Run</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Pay Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Employees</TableHead>
                                <TableHead>Net Pay</TableHead>
                                <TableHead className="pr-6 w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : runs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <ReceiptText className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No payroll runs yet</p>
                                        <p className="text-muted-foreground mt-1 text-sm">Run payroll for a period to get started.</p>
                                    </TableCell>
                                </TableRow>
                            ) : runs.map(run => (
                                <TableRow key={run.id}>
                                    <TableCell className="pl-6 font-mono text-sm">{run.run_number}</TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(run.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        {' – '}
                                        {new Date(run.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(run.pay_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell><StatusBadge status={run.status} /></TableCell>
                                    <TableCell className="text-sm">{run.employee_count}</TableCell>
                                    <TableCell className="num-tabular text-sm font-semibold">{fmt(run.total_net_pay)}</TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push(`/payroll/${run.id}`)} aria-label="View run">
                                            <Eye className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && total > ITEMS_PER_PAGE && (
                    <div className="border-border border-t px-6 py-3">
                        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} total={total} isLoading={loading} />
                    </div>
                )}
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={open => !open && setIsCreateOpen(false)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Run Payroll</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-5 pt-2">
                        <div className="space-y-1.5">
                            <Label>Pay Period</Label>
                            <DatePicker.RangePicker
                                className="w-full"
                                value={form.range}
                                onChange={dates => setForm(f => ({ ...f, range: dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null }))}
                                format="DD MMM YYYY"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Pay Date</Label>
                            <DatePicker
                                className="h-9 w-full"
                                value={form.payDate}
                                onChange={date => setForm(f => ({ ...f, payDate: date }))}
                                format="DD MMM YYYY"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="e.g. July payroll"
                                className="min-h-[80px] resize-none"
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Running payroll for a period that already has a run just reopens the existing one — safe to click even if unsure.
                        </p>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={creating}>{creating ? 'Calculating…' : 'Run Payroll'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
