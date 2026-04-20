"use client"

import { useEffect, useState, use } from 'react';
import {
    FileText, Download, Calendar, Clock, CheckCircle, XCircle,
    ArrowLeft, Printer, HardDrive, Info, Eye, Settings, BarChart2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReportResponse, ReportStatus } from '@/interfaces/report';
import { getReportByID, downloadReport, getReportPreview, ReportPreviewData } from '@/(api-handlers)/reportHandler';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                 */
/* ---------------------------------------------------------------------- */
const REPORT_TYPES = [
    { value: 'daily_sales', label: 'Daily Sales Report' },
    { value: 'monthly_financial', label: 'Monthly Financial Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'employee_performance', label: 'Employee Performance Report' },
    { value: 'customer_analytics', label: 'Customer Analytics Report' },
];

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; text: string; bg: string; iconBg: string }> = {
    pending: { icon: <Clock className="size-4" />, text: 'Pending Approval', bg: 'bg-amber-50', iconBg: 'bg-amber-100 text-amber-600' },
    approved: { icon: <CheckCircle className="size-4" />, text: 'Approved', bg: 'bg-blue-50', iconBg: 'bg-blue-100 text-blue-600' },
    processing: { icon: <Clock className="size-4" />, text: 'Processing', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600' },
    completed: { icon: <CheckCircle className="size-4" />, text: 'Completed', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600' },
    failed: { icon: <XCircle className="size-4" />, text: 'Failed', bg: 'bg-rose-50', iconBg: 'bg-rose-100 text-rose-600' },
    rejected: { icon: <XCircle className="size-4" />, text: 'Rejected', bg: 'bg-rose-50', iconBg: 'bg-rose-100 text-rose-600' },
};

const STATUS_MESSAGES: Record<ReportStatus, string> = {
    completed: 'This report has been successfully generated and is ready for analysis. You can download it in the format requested.',
    pending: 'The generation request is currently awaiting administrator review. You will be notified once it is approved.',
    approved: 'This report request has been approved and will begin processing shortly.',
    processing: 'The report is currently being processed by our generation engine. This might take a few moments depending on the data size.',
    failed: 'An error occurred while generating this report. Please try submitting a new request.',
    rejected: 'This report request was rejected. See the rejection feedback below for more details.',
};

/* ---------------------------------------------------------------------- */
/*  Page                                                                    */
/* ---------------------------------------------------------------------- */
export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);

    const PREVIEW_TYPES = ['employee_performance', 'monthly_financial'];

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const r = await getReportByID(Number.parseInt(id));
                setReport(r);
                if (r.status === 'completed' && PREVIEW_TYPES.includes(r.report_type)) {
                    try {
                        setPreviewData(await getReportPreview(r.id));
                    } catch {
                        // preview is optional — don't block the page
                    }
                }
            } catch (error: unknown) {
                handleErrorMessage(error, 'Failed to fetch report details');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    const handleDownload = async () => {
        if (!report || report.status !== 'completed') return;
        setDownloading(true);
        const fileName = `${report.report_name.replace(/\s+/g, '_')}_${report.id}.${report.file_format}`;
        try {
            await downloadReport(report.id, fileName);
            toast.success('Download started');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to download report');
        } finally {
            setDownloading(false);
        }
    };

    /* ---- Loading ---- */
    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50/40">
                <RefreshCcw className="size-6 animate-spin" />
                <p className="text-sm font-medium">Loading report intelligence…</p>
            </div>
        );
    }

    /* ---- Not found ---- */
    if (!report) {
        return (
            <div className="p-8 min-h-screen">
                <EmptyState
                    title="Report Not Found"
                    description="The report you are looking for might have been deleted or moved."
                    actions={
                        <Button variant="outline" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="size-4" /> Go Back
                        </Button>
                    }
                />
            </div>
        );
    }

    const statusConf = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
    const typeLabel = REPORT_TYPES.find(t => t.value === report.report_type)?.label ?? report.report_type;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            {/* ---- Breadcrumb + Header ---- */}
            <div className="max-w-7xl mx-auto mb-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <Link href="/report" className="hover:text-blue-600 transition-colors">Reports</Link>
                    <span>/</span>
                    <span className="text-slate-700 font-medium line-clamp-1">{report.report_name}</span>
                </nav>

                {/* Title row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
                            <FileText className="size-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">{report.report_name}</h1>
                            <div className="flex items-center gap-2 flex-wrap text-slate-500 text-sm">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                    {typeLabel}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    Requested {new Date(report.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" onClick={() => globalThis.print()} className="gap-2 rounded-xl">
                            <Printer className="size-4" /> Print Details
                        </Button>
                        <Button
                            onClick={handleDownload}
                            disabled={downloading || report.status !== 'completed'}
                            className="gap-2 rounded-xl px-6 shadow-md shadow-blue-100"
                        >
                            {downloading
                                ? <><span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Downloading…</>
                                : <><Download className="size-4" /> Download Report</>}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ---- Grid ---- */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ---- Left / Main ---- */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Status Banner */}
                    <div className={`${statusConf.bg} rounded-2xl p-5 flex items-start gap-4`}>
                        <div className={`p-2 rounded-lg shrink-0 ${statusConf.iconBg}`}>
                            {statusConf.icon}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-1">Current Status: {statusConf.text}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {STATUS_MESSAGES[report.status]}
                            </p>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <span className="font-semibold text-slate-700 flex items-center gap-2">
                                <Eye className="size-4" /> Report Summary Intelligence
                            </span>
                            <Settings className="size-4 text-slate-400" />
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {[
                                    { label: 'Format', value: report.file_format.toUpperCase() },
                                    { label: 'Size', value: formatFileSize(report.file_size) },
                                    { label: 'Pages', value: '12 (Est.)' },
                                    { label: 'Expiration', value: report.expires_at ? new Date(report.expires_at).toLocaleDateString() : 'None' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
                                        <p className="text-lg font-semibold text-slate-800">{value}</p>
                                    </div>
                                ))}
                            </div>

                            <hr className="my-8 border-slate-100" />

                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                    <div>
                                        <p className="font-medium text-slate-700">Organization Context</p>
                                        <p className="text-sm text-slate-500">
                                            Generated for Organization ID #{report.organization_id} by User #{report.generated_by}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="size-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <div>
                                        <p className="font-medium text-slate-700">Temporal Range</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(report.period_start).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            {' — '}
                                            {new Date(report.period_end).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Preview */}
                    {previewData && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                                <BarChart2 className="size-4 text-primary" />
                                <span className="font-semibold text-slate-700">{previewData.title}</span>
                                <span className="ml-auto text-xs text-slate-400">{previewData.period}</span>
                            </div>

                            {/* Summary stats */}
                            <div className="px-6 pt-5 pb-4 grid grid-cols-2 md:grid-cols-3 gap-4 border-b border-slate-100">
                                {Object.entries(previewData.summary).map(([key, val]) => (
                                    <div key={key} className="space-y-0.5">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{String(val)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Data table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/70">
                                            {previewData.headers.map(h => (
                                                <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.rows.slice(0, 15).map((row, i) => (
                                            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-4 py-2.5 text-slate-700">{String(cell)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                        {previewData.rows.length > 15 && (
                                            <tr className="border-t border-slate-50">
                                                <td colSpan={previewData.headers.length} className="px-4 py-2.5 text-slate-400 text-center italic">
                                                    + {previewData.rows.length - 15} more rows — download the full report for complete data
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-6">
                            <Info className="size-4 text-slate-400" /> Activity Timeline
                        </h2>
                        <div className="space-y-6 relative ml-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:-ml-4">
                            <div className="relative">
                                <div className="absolute size-3 rounded-full bg-primary border-4 border-white shadow-sm -left-[21px] top-1" />
                                <div className="pl-4">
                                    <p className="text-sm font-semibold text-slate-800">Generation Initiated</p>
                                    <p className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            {report.approved_at && (
                                <div className="relative">
                                    <div className="absolute size-3 rounded-full bg-emerald-500 border-4 border-white shadow-sm -left-[21px] top-1" />
                                    <div className="pl-4">
                                        <p className="text-sm font-semibold text-slate-800">Admin Approval Granted</p>
                                        <p className="text-xs text-slate-500">
                                            Approved by User #{report.approved_by} at {new Date(report.approved_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {report.status === 'completed' && (
                                <div className="relative">
                                    <div className="absolute size-3 rounded-full bg-indigo-500 border-4 border-white shadow-sm -left-[21px] top-1" />
                                    <div className="pl-4">
                                        <p className="text-sm font-semibold text-slate-800">File Rendering Successful</p>
                                        <p className="text-xs text-slate-500">{new Date(report.generated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ---- Right / Sidebar ---- */}
                <div className="space-y-6">
                    {/* Parameters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 size-24 bg-slate-50 rounded-full" />
                        <h2 className="text-base font-semibold text-slate-800 mb-6 relative">Parameters Used</h2>
                        <div className="space-y-5 relative">
                            {[
                                { icon: <HardDrive className="size-4" />, label: 'Target Shop ID', value: report.parameters.shop_id },
                                { icon: <CheckCircle className="size-4" />, label: 'Tax Inclusion', value: report.parameters.include_tax ? 'Active' : 'Disabled' },
                                { icon: <Clock className="size-4" />, label: 'Payment Mode', value: report.parameters.payment_method || 'All Methods' },
                                { icon: <Settings className="size-4" />, label: 'Generation Engine', value: 'Paynest v2.1' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded-md text-slate-400">{item.icon}</div>
                                        <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 uppercase">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Paynest branding chip */}
                    <div className="bg-slate-900 rounded-2xl p-6">
                        <p className="text-white text-[10px] uppercase font-bold tracking-widest leading-none">
                            Intelligence Generated by Paynest POS
                        </p>
                    </div>

                    {/* Rejection reason */}
                    {report.rejection_reason && (
                        <div className="bg-rose-50/30 rounded-2xl border border-rose-100 p-6">
                            <h2 className="text-sm font-semibold text-rose-800 flex items-center gap-2 mb-4 italic">
                                <XCircle className="size-4" /> Rejection Feedback
                            </h2>
                            <p className="text-sm text-rose-700 italic border-l-2 border-rose-200 pl-3">
                                &apos;{report.rejection_reason}&apos;
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
