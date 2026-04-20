"use client"

import { useEffect, useRef, useState } from 'react';
import {
    FileText, Calendar, Search, Clock,
    CheckCircle, XCircle, Eye, RefreshCcw, Check, X, AlertCircle,
} from 'lucide-react';
import { ApproveReportRequest, ReportResponse, ReportStatus } from '@/interfaces/report';
import { getPendingReports, getApprovedReports, getReportByID } from '@/(api-handlers)/reportHandler';
import PageHeader from '@/components/(shared-components)/PageHeader';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

function Dialog({ open, onClose, title, children, width = 'max-w-lg' }: {
    open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; width?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    if (!open) return null;
    return (
        <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === ref.current) onClose(); }}>
            <div className={cn('bg-white rounded-2xl shadow-2xl w-full overflow-hidden', width)}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">{title}</div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                </div>
                <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function PendingReportsView() {
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);

    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [approveComments, setApproveComments] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectComments, setRejectComments] = useState('');
    const [rejectReasonError, setRejectReasonError] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getPendingReports();
            setReports(data);
            setFilteredReports(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch pending reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    useEffect(() => {
        let filtered = reports;
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.report_type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (typeFilter !== 'all') filtered = filtered.filter(r => r.report_type === typeFilter);
        setFilteredReports(filtered);
    }, [searchTerm, typeFilter, reports]);

    const handlePreview = async (reportId: number) => {
        setPreviewLoading(true);
        setIsPreviewOpen(true);
        try {
            setSelectedReport(await getReportByID(reportId));
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch report details');
            setIsPreviewOpen(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const openApprove = (report: ReportResponse) => { setSelectedReport(report); setIsApproveOpen(true); };
    const openReject = (report: ReportResponse) => { setSelectedReport(report); setIsRejectOpen(true); };

    const handleApprove = async () => {
        if (!selectedReport) return;
        setActionLoading(true);
        try {
            const data: ApproveReportRequest = { approved: true, rejection_reason: '', comments: approveComments || 'Report request approved' };
            await getApprovedReports(selectedReport.id, data);
            toast.success('Report request approved successfully');
            setIsApproveOpen(false);
            setApproveComments('');
            fetchReports();
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to approve report');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedReport) return;
        if (!rejectReason.trim()) { setRejectReasonError('Rejection reason is required'); return; }
        setActionLoading(true);
        try {
            const data: ApproveReportRequest = { approved: false, rejection_reason: rejectReason, comments: rejectComments || 'Report request rejected' };
            await getApprovedReports(selectedReport.id, data);
            toast.success('Report request rejected');
            setIsRejectOpen(false);
            setRejectReason('');
            setRejectComments('');
            fetchReports();
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to reject report');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <TooltipProvider>
            <div className="p-4 space-y-6">
                <PageHeader title="Pending Report Requests" description="Review and manage pending report generation requests from your organization." />

                <Card className="border-slate-100 shadow-sm rounded-2xl">
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                                <Input placeholder="Search by name or type…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                            </div>
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
                                            <span className="text-sm">Fetching pending reports…</span>
                                        </div>
                                    </td></tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr><td colSpan={6} className="py-16">
                                        <EmptyState
                                            title="No pending requests"
                                            description={searchTerm || typeFilter !== 'all'
                                                ? 'No pending reports match your filters.'
                                                : 'There are currently no report generation requests awaiting approval.'}
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
                                                        <Button variant="ghost" size="icon" className="size-8 text-blue-500 hover:bg-blue-50" onClick={() => handlePreview(report.id)}>
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Preview Request</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8 text-emerald-600 hover:bg-emerald-50" onClick={() => openApprove(report)}>
                                                            <Check className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Approve Request</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8 text-rose-500 hover:bg-rose-50" onClick={() => openReject(report)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Reject Request</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Preview */}
                <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={<><Eye className="size-5 text-primary" /> Report Request Preview</>} width="max-w-2xl">
                    {previewLoading ? (
                        <div className="flex justify-center py-8 text-slate-400"><RefreshCcw className="size-5 animate-spin" /></div>
                    ) : selectedReport ? (
                        <div className="space-y-4">
                            {[
                                { label: 'Report Name', value: selectedReport.report_name },
                                { label: 'Type', value: <TypeBadge type={selectedReport.report_type} /> },
                                { label: 'Status', value: <StatusBadge status={selectedReport.status} /> },
                                { label: 'Period', value: `${new Date(selectedReport.period_start).toLocaleDateString()} – ${new Date(selectedReport.period_end).toLocaleDateString()}` },
                                { label: 'Requested', value: new Date(selectedReport.created_at).toLocaleString() },
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
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => { setIsPreviewOpen(false); if (selectedReport) openApprove(selectedReport); }}>
                                    <Check className="size-4 mr-1" /> Approve
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </Dialog>

                {/* Approve */}
                <Dialog open={isApproveOpen} onClose={() => setIsApproveOpen(false)} title={<><CheckCircle className="size-5 text-emerald-500" /> Approve Report Request</>}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Are you sure you want to approve the generation of <strong>{selectedReport?.report_name}</strong>?</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Comments <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <Textarea rows={3} placeholder="Add any comments…" value={approveComments} onChange={e => setApproveComments(e.target.value)} className="resize-none" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={actionLoading} onClick={handleApprove}>
                                {actionLoading ? <span className="flex items-center gap-2"><span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Approving…</span>
                                    : <><Check className="size-4 mr-1" /> Confirm Approval</>}
                            </Button>
                        </div>
                    </div>
                </Dialog>

                {/* Reject */}
                <Dialog open={isRejectOpen} onClose={() => { setIsRejectOpen(false); setRejectReasonError(''); }} title={<><XCircle className="size-5 text-rose-500" /> Reject Report Request</>}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Please provide a reason for rejecting <strong>{selectedReport?.report_name}</strong>.</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rejection Reason <span className="text-rose-500">*</span></label>
                            <Textarea rows={3} placeholder="Example: Incorrect date range or parameters selected."
                                value={rejectReason}
                                onChange={e => { setRejectReason(e.target.value); setRejectReasonError(''); }}
                                className={cn('resize-none', rejectReasonError && 'border-rose-400 focus-visible:ring-rose-400')}
                            />
                            {rejectReasonError && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="size-3" />{rejectReasonError}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Comments <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <Textarea rows={2} placeholder="Any other notes…" value={rejectComments} onChange={e => setRejectComments(e.target.value)} className="resize-none" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setIsRejectOpen(false); setRejectReasonError(''); }}>Cancel</Button>
                            <Button variant="destructive" disabled={actionLoading} onClick={handleReject}>
                                {actionLoading ? <span className="flex items-center gap-2"><span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Rejecting…</span>
                                    : <><X className="size-4 mr-1" /> Reject Request</>}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}