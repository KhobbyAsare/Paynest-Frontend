"use client"

import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Search, Clock, CheckCircle, XCircle, Eye, RefreshCcw } from 'lucide-react';
import { ReportResponse, ReportStatus } from '@/interfaces/report';
import { getAllReports, downloadReport } from '@/(api-handlers)/reportHandler';
import Link from 'next/link';
import PageHeader from '@/components/(shared-components)/PageHeader';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */
const REPORT_TYPES = [
    { value: 'daily_sales', label: 'Daily Sales Report' },
    { value: 'monthly_financial', label: 'Monthly Financial Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'employee_performance', label: 'Employee Performance Report' },
    { value: 'customer_analytics', label: 'Customer Analytics Report' },
];

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; variant: StatusVariant }> = {
    pending: { icon: <Clock className="size-3" />, label: 'Pending', variant: 'outline' },
    approved: { icon: <CheckCircle className="size-3" />, label: 'Approved', variant: 'secondary' },
    processing: { icon: <Clock className="size-3" />, label: 'Processing', variant: 'secondary' },
    completed: { icon: <CheckCircle className="size-3" />, label: 'Completed', variant: 'default' },
    rejected: { icon: <XCircle className="size-3" />, label: 'Rejected', variant: 'destructive' },
    failed: { icon: <XCircle className="size-3" />, label: 'Failed', variant: 'destructive' },
};

function StatusBadge({ status }: { status: ReportStatus }) {
    const meta = STATUS_META[status] ?? STATUS_META.pending;
    return (
        <Badge variant={meta.variant} className="flex items-center gap-1 w-fit text-[11px] px-2">
            {meta.icon}
            {meta.label}
        </Badge>
    );
}

function TypeBadge({ type }: { type: string }) {
    const label = REPORT_TYPES.find(t => t.value === type)?.label ?? type;
    return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            {label}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function AdminAllReportsView() {
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getAllReports();
            setReports(data);
            setFilteredReports(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        let filtered = reports;
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.report_type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);
        if (typeFilter !== 'all') filtered = filtered.filter(r => r.report_type === typeFilter);
        setFilteredReports(filtered);
    }, [searchTerm, statusFilter, typeFilter, reports]);

    const handleDownload = async (report: ReportResponse) => {
        if (report.status !== 'completed') {
            toast.error('Report file is not available until it is completed.');
            return;
        }
        const fileName = `${report.report_name.replace(/\s+/g, '_')}_${report.id}.${report.file_format}`;
        try {
            await downloadReport(report.id, fileName);
            toast.success('Download started');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to download report');
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */
    return (
        <TooltipProvider>
            <div className="p-4 space-y-6">
                <PageHeader
                    title="All Organization Reports"
                    description="View and download all generated reports for your organization."
                />

                {/* Filters */}
                <Card className="border-slate-100 shadow-sm rounded-2xl">
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                                <Input
                                    placeholder="Search reports…"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="sm:w-48">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending Approval</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="sm:w-64">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {REPORT_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    {['Report Name', 'Type', 'Period', 'Status', 'Created At', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <RefreshCcw className="size-5 animate-spin" />
                                                <span className="text-sm">Fetching reports…</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16">
                                            <EmptyState
                                                title="No reports found"
                                                description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                                    ? 'No reports match your filters.'
                                                    : 'No reports have been generated yet.'}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map(report => (
                                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4 text-sm font-medium text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="size-4 text-slate-400 shrink-0" />
                                                    <span className="line-clamp-1">{report.report_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-500">
                                                <TypeBadge type={report.report_type} />
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    {new Date(report.period_start).toLocaleDateString()} – {new Date(report.period_end).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge status={report.status} />
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" asChild>
                                                                <Link href={`/report/${report.id}`}><Eye className="size-4" /></Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View Intelligence</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 hover:bg-slate-100"
                                                                disabled={report.status !== 'completed'}
                                                                onClick={() => handleDownload(report)}
                                                            >
                                                                <Download className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Download Report</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </TooltipProvider>
    );
}