"use client"

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMyPayslips } from '@/(api-handlers)/payrollHandler';
import { MyPayslipSummary } from '@/interfaces/payroll';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { useCurrency } from '@/hooks/useCurrency';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ReceiptText } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyPayslipsPage() {
    const router = useRouter();
    const fmt = useCurrency();

    const [payslips, setPayslips] = useState<MyPayslipSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyPayslips((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
            setPayslips(res.items);
            setTotal(res.total);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load payslips');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="My Payslips"
                description="View and download your payslips from every processed payroll run."
            />

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Period</TableHead>
                                <TableHead>Pay Date</TableHead>
                                <TableHead>Run #</TableHead>
                                <TableHead>Net Pay</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : payslips.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <ReceiptText className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No payslips yet</p>
                                        <p className="text-muted-foreground mt-1 text-sm">Payslips appear here once a payroll run covering you has been processed.</p>
                                    </TableCell>
                                </TableRow>
                            ) : payslips.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="pl-6 text-sm">
                                        {formatDate(p.period_start)} – {formatDate(p.period_end)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{formatDate(p.pay_date)}</TableCell>
                                    <TableCell className="font-mono text-sm">{p.run_number}</TableCell>
                                    <TableCell className="num-tabular text-sm font-semibold">{fmt(p.net_pay)}</TableCell>
                                    <TableCell><Badge variant="outline" className="rounded-full text-xs capitalize">{p.status}</Badge></TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button
                                            variant="ghost" size="icon" className="size-8"
                                            onClick={() => router.push(`/payroll/payslips/${p.id}`)}
                                            aria-label="View payslip"
                                        >
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
        </div>
    );
}
