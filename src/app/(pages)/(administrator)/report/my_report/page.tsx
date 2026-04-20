"use client"

import { useEffect, useRef, useState } from 'react';
import {
    Plus, FileText, Calendar, Search, Clock,
    CheckCircle, XCircle, Eye, Download, RefreshCcw,
} from 'lucide-react';
import { ReportFileFormat, ReportRequest, ReportResponse, ReportStatus, ReportType } from '@/interfaces/report';
import { createReport, getMyResports, getReportByID, downloadReport } from '@/(api-handlers)/reportHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import PageHeader from '@/components/(shared-components)/PageHeader';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */
const REPORT_TYPES = [
    { value: 'daily_sales', label: 'Daily Sales Report' },
    { value: 'monthly_financial', label: 'Monthly Financial Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'employee_performance', label: 'Employee Performance Report' },
    { value: 'customer_analytics', label: 'Customer Analytics Report' },
];

const FILE_FORMATS = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
];

const PAYMENT_METHODS = [
    { value: 'all', label: 'All Payment Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'mobile_money', label: 'Mobile Money' },
];

/* -------------------------------------------------------------------------- */
/*  Status badge                                                               */
/* -------------------------------------------------------------------------- */
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
            {meta.icon}{meta.label}
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
/*  Small form helpers                                                         */
/* -------------------------------------------------------------------------- */
function FieldLabel({ children, required }: Readonly<{ children: React.ReactNode; required?: boolean }>) {
    return (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}

/* -------------------------------------------------------------------------- */
/*  Dialog                                                                     */
/* -------------------------------------------------------------------------- */
interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    width?: string;
}

function Dialog({ open, onClose, title, children, width = 'max-w-lg' }: DialogProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    if (!open) return null;
    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={cn('bg-white rounded-2xl shadow-2xl w-full overflow-hidden', width)}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">{title}</div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none">&times;</button>
                </div>
                <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Form state                                                                 */
/* -------------------------------------------------------------------------- */
interface ReportFormState {
    report_name: string;
    report_type: string;
    period_start: string;
    period_end: string;
    shop_id: string;
    payment_method: string;
    file_format: string;
    include_tax: boolean;
}

interface ReportFormErrors {
    report_name?: string;
    report_type?: string;
    period_start?: string;
    period_end?: string;
    shop_id?: string;
    file_format?: string;
}

const defaultForm: ReportFormState = {
    report_name: '',
    report_type: '',
    period_start: '',
    period_end: '',
    shop_id: '',
    payment_method: 'all',
    file_format: 'pdf',
    include_tax: true,
};

/* -------------------------------------------------------------------------- */
/*  Page (My Reports / Manager view)                                           */
/* -------------------------------------------------------------------------- */
export default function ManagerReportView() {
    const { user } = useAuthStore();

    // Data
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    // Create report dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<ReportFormState>(defaultForm);
    const [formErrors, setFormErrors] = useState<ReportFormErrors>({});

    // Preview dialog
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    /* ---- Fetch ---- */
    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getMyResports();
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
        getOrganizationShops().then(setShops).catch(() => null);
    }, []);

    /* ---- Filter ---- */
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

    /* ---- Form helpers ---- */
    function setF<K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
        if (formErrors[key as keyof ReportFormErrors]) {
            setFormErrors(prev => ({ ...prev, [key]: undefined }));
        }
    }

    function validateForm(): boolean {
        const e: ReportFormErrors = {};
        if (!form.report_name.trim()) e.report_name = 'Report name is required';
        if (!form.report_type) e.report_type = 'Report type is required';
        if (!form.period_start) e.period_start = 'Start date is required';
        if (!form.period_end) e.period_end = 'End date is required';
        if (!form.shop_id) e.shop_id = 'Shop is required';
        if (!form.file_format) e.file_format = 'File format is required';
        setFormErrors(e);
        return Object.keys(e).length === 0;
    }

    /* ---- Handlers ---- */
    const handleCreateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setCreating(true);
        try {
            const reportData: ReportRequest = {
                report_type: form.report_type as ReportType,
                report_name: form.report_name,
                report_period: 'custom',
                parameters: {
                    shop_id: Number(form.shop_id),
                    include_tax: form.include_tax,
                    payment_method: form.payment_method,
                },
                file_format: form.file_format as ReportFileFormat,
                period_start: form.period_start,
                period_end: form.period_end,
                organization_id: user?.organization?.id ?? 0,
            };
            await createReport(reportData);
            toast.success('Report generation initiated successfully');
            setIsCreateOpen(false);
            setForm(defaultForm);
            fetchReports();
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to create report');
        } finally {
            setCreating(false);
        }
    };

    const handlePreview = async (reportId: number) => {
        setPreviewLoading(true);
        setIsPreviewOpen(true);
        try {
            const report = await getReportByID(reportId);
            setSelectedReport(report);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch report details');
            setIsPreviewOpen(false);
        } finally {
            setPreviewLoading(false);
        }
    };

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

    const closeCreate = () => { setIsCreateOpen(false); setForm(defaultForm); setFormErrors({}); };

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */
    return (
        <TooltipProvider>
            <div className="p-4 space-y-6">
                <PageHeader title="My Reports" description="Generate and manage your personal reports.">
                    <Button className="flex items-center gap-2" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="size-4" /> Generate Report
                    </Button>
                </PageHeader>

                {/* Filters */}
                <Card className="border-slate-100 shadow-sm rounded-2xl">
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                                <Input placeholder="Search reports…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="sm:w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
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
                                <SelectTrigger className="sm:w-64"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
                                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <RefreshCcw className="size-5 animate-spin" />
                                            <span className="text-sm">Fetching reports…</span>
                                        </div>
                                    </td></tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr><td colSpan={6} className="py-16">
                                        <EmptyState
                                            title="No reports found"
                                            description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                                ? 'No reports match your filters.'
                                                : "You haven't generated any reports yet. Click the button above to create one."}
                                        />
                                    </td></tr>
                                ) : filteredReports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-4 text-sm font-medium text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <FileText className="size-4 text-slate-400 shrink-0" />
                                                <span className="line-clamp-1">{report.report_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4"><TypeBadge type={report.report_type} /></td>
                                        <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="size-3.5 text-slate-400" />
                                                {new Date(report.period_start).toLocaleDateString()} – {new Date(report.period_end).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4"><StatusBadge status={report.status} /></td>
                                        <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(report.created_at).toLocaleDateString()}</td>
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
                                                            variant="ghost" size="icon" className="size-8 hover:bg-slate-100"
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* ── Create Report Dialog ── */}
                <Dialog open={isCreateOpen} onClose={closeCreate} title={<><FileText className="size-5 text-primary" /> Generate New Report</>}>
                    <form onSubmit={handleCreateReport} noValidate className="space-y-4">
                        <div>
                            <FieldLabel required>Report Name</FieldLabel>
                            <Input placeholder="Q1 Sales Report" value={form.report_name} onChange={e => setF('report_name', e.target.value)}
                                className={cn(formErrors.report_name && 'border-rose-400 focus-visible:ring-rose-400')} />
                            {formErrors.report_name && <p className="mt-1 text-xs text-rose-500">{formErrors.report_name}</p>}
                        </div>
                        <div>
                            <FieldLabel required>Report Type</FieldLabel>
                            <Select value={form.report_type} onValueChange={v => setF('report_type', v)}>
                                <SelectTrigger className={cn('w-full', formErrors.report_type && 'border-rose-400')}>
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {formErrors.report_type && <p className="mt-1 text-xs text-rose-500">{formErrors.report_type}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <FieldLabel required>Period Start</FieldLabel>
                                <DatePicker
                                    className={cn("w-full h-10", formErrors.period_start && 'border-rose-400')}
                                    value={form.period_start ? dayjs(form.period_start) : null}
                                    onChange={(date) => setF('period_start', date ? date.format('YYYY-MM-DD') : '')}
                                    placeholder="Start date"
                                />
                                {formErrors.period_start && <p className="mt-1 text-xs text-rose-500">{formErrors.period_start}</p>}
                            </div>
                            <div>
                                <FieldLabel required>Period End</FieldLabel>
                                <DatePicker
                                    className={cn("w-full h-10", formErrors.period_end && 'border-rose-400')}
                                    value={form.period_end ? dayjs(form.period_end) : null}
                                    onChange={(date) => setF('period_end', date ? date.format('YYYY-MM-DD') : '')}
                                    placeholder="End date"
                                />
                                {formErrors.period_end && <p className="mt-1 text-xs text-rose-500">{formErrors.period_end}</p>}
                            </div>
                        </div>
                        <div>
                            <FieldLabel required>Shop</FieldLabel>
                            <Select value={form.shop_id} onValueChange={v => setF('shop_id', v)}>
                                <SelectTrigger className={cn('w-full', formErrors.shop_id && 'border-rose-400')}>
                                    <SelectValue placeholder="Select shop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shops.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {formErrors.shop_id && <p className="mt-1 text-xs text-rose-500">{formErrors.shop_id}</p>}
                        </div>
                        <div>
                            <FieldLabel>Payment Method</FieldLabel>
                            <Select value={form.payment_method} onValueChange={v => setF('payment_method', v)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <FieldLabel required>File Format</FieldLabel>
                            <Select value={form.file_format} onValueChange={v => setF('file_format', v)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {FILE_FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
                            <label className="text-sm font-medium text-slate-700">Include Tax</label>
                            <Switch checked={form.include_tax} onCheckedChange={v => setF('include_tax', v)} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={closeCreate}>Cancel</Button>
                            <Button type="submit" disabled={creating} className="min-w-[140px]">
                                {creating ? (
                                    <span className="flex items-center gap-2">
                                        <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Generating…
                                    </span>
                                ) : (<><Plus className="size-4 mr-1" /> Generate Report</>)}
                            </Button>
                        </div>
                    </form>
                </Dialog>

                {/* ── Preview Dialog ── */}
                <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={<><Eye className="size-5 text-primary" /> Report Details</>} width="max-w-2xl">
                    {previewLoading ? (
                        <div className="flex justify-center py-8 text-slate-400">
                            <RefreshCcw className="size-5 animate-spin" />
                        </div>
                    ) : selectedReport ? (
                        <div className="space-y-5">
                            {[
                                { label: 'Report Name', value: selectedReport.report_name },
                                { label: 'Report Type', value: <TypeBadge type={selectedReport.report_type} /> },
                                { label: 'Status', value: <StatusBadge status={selectedReport.status} /> },
                                { label: 'Period', value: `${new Date(selectedReport.period_start).toLocaleDateString()} – ${new Date(selectedReport.period_end).toLocaleDateString()}` },
                                { label: 'Created At', value: new Date(selectedReport.created_at).toLocaleString() },
                                { label: 'Shop ID', value: selectedReport.parameters.shop_id },
                                { label: 'Include Tax', value: selectedReport.parameters.include_tax ? 'Yes' : 'No' },
                                { label: 'Payment Method', value: selectedReport.parameters.payment_method },
                                { label: 'File Format', value: selectedReport.file_format.toUpperCase() },
                            ].map(row => (
                                <div key={row.label} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{row.label}</span>
                                    <span className="text-sm font-medium text-slate-800">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </Dialog>
            </div>
        </TooltipProvider>
    );
}