"use client"

import { useEffect, useState, use } from 'react';
import {
    FileText, Download, Calendar, Clock, CheckCircle, XCircle,
    ArrowLeft, Printer, HardDrive, Info, Eye, Settings, BarChart2, RefreshCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReportResponse, ReportStatus } from '@/interfaces/report';
import { getReportByID, downloadReport, getReportPreview, ReportPreviewData } from '@/(api-handlers)/reportHandler';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/(shared-components)/PageHeader';

const REPORT_TYPES = [
    { value: 'daily_sales',          label: 'Daily Sales Report' },
    { value: 'monthly_financial',    label: 'Monthly Financial Report' },
    { value: 'inventory',            label: 'Inventory Report' },
    { value: 'employee_performance', label: 'Employee Performance Report' },
    { value: 'customer_analytics',   label: 'Customer Analytics Report' },
];

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const STATUS_CONFIG: Record<string, {
    Icon: React.ElementType;
    text: string;
    badgeClass: string;
}> = {
    pending:    { Icon: Clock,         text: 'Pending Approval', badgeClass: 'border-warning/30 bg-warning/10 text-warning-foreground'    },
    approved:   { Icon: CheckCircle,   text: 'Approved',         badgeClass: 'border-primary/20 bg-primary/10 text-primary'               },
    processing: { Icon: Clock,         text: 'Processing',       badgeClass: 'border-info/30 bg-info/10 text-info'                        },
    completed:  { Icon: CheckCircle,   text: 'Completed',        badgeClass: 'border-success/30 bg-success/10 text-success'               },
    failed:     { Icon: XCircle,       text: 'Failed',           badgeClass: 'border-destructive/30 bg-destructive/10 text-destructive'   },
    rejected:   { Icon: XCircle,       text: 'Rejected',         badgeClass: 'border-destructive/30 bg-destructive/10 text-destructive'   },
};

const STATUS_MESSAGES: Record<ReportStatus, string> = {
    completed:  'This report has been successfully generated and is ready for analysis. You can download it in the format requested.',
    pending:    'The generation request is currently awaiting administrator review. You will be notified once it is approved.',
    approved:   'This report request has been approved and will begin processing shortly.',
    processing: 'The report is currently being processed. This might take a few moments depending on the data size.',
    failed:     'An error occurred while generating this report. Please try submitting a new request.',
    rejected:   'This report request was rejected. See the rejection feedback below for more details.',
};

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [report, setReport]           = useState<ReportResponse | null>(null);
    const [loading, setLoading]         = useState(true);
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
                    try { setPreviewData(await getReportPreview(r.id)); } catch { /* preview optional */ }
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

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col gap-6">
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
    const { Icon: StatusIcon } = statusConf;
    const typeLabel = REPORT_TYPES.find(t => t.value === report.report_type)?.label ?? report.report_type;

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <nav className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Link href="/report" className="hover:text-foreground transition-colors">Reports</Link>
                <span>/</span>
                <span className="text-foreground line-clamp-1 font-medium">{report.report_name}</span>
            </nav>

            <PageHeader
                title={report.report_name}
                description={`${typeLabel} · Requested ${new Date(report.created_at).toLocaleDateString()}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => globalThis.print()} className="h-9">
                            <Printer className="mr-2 size-4" /> Print
                        </Button>
                        <Button
                            size="sm"
                            className="h-9"
                            onClick={handleDownload}
                            disabled={downloading || report.status !== 'completed'}
                        >
                            {downloading
                                ? <><RefreshCcw className="mr-2 size-4 animate-spin" /> Downloading…</>
                                : <><Download className="mr-2 size-4" /> Download</>
                            }
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left — main content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Status banner */}
                    <Card className={cn('flex items-start gap-4 p-5', statusConf.badgeClass.replace(/border-\S+/, ''))}>
                        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', statusConf.badgeClass)}>
                            <StatusIcon className="size-4" />
                        </div>
                        <div>
                            <p className="text-foreground mb-1 font-semibold">Status: {statusConf.text}</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                {STATUS_MESSAGES[report.status]}
                            </p>
                        </div>
                    </Card>

                    {/* Summary */}
                    <Card className="gap-0 overflow-hidden p-0">
                        <CardHeader className="border-border bg-muted/30 flex flex-row items-center justify-between border-b px-6 py-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Eye className="size-4" /> Report Summary
                            </CardTitle>
                            <Settings className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                {[
                                    { label: 'Format',     value: report.file_format.toUpperCase() },
                                    { label: 'Size',       value: formatFileSize(report.file_size) },
                                    { label: 'Pages',      value: '12 (Est.)' },
                                    { label: 'Expiration', value: report.expires_at ? new Date(report.expires_at).toLocaleDateString() : 'None' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{label}</p>
                                        <p className="text-foreground text-lg font-semibold">{value}</p>
                                    </div>
                                ))}
                            </div>

                            <hr className="border-border my-6" />

                            <div className="space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                                    <div>
                                        <p className="text-foreground font-medium">Organization Context</p>
                                        <p className="text-muted-foreground text-sm">
                                            Generated for Organization #{report.organization_id} by User #{report.generated_by}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-info mt-1.5 size-2 shrink-0 rounded-full" />
                                    <div>
                                        <p className="text-foreground font-medium">Temporal Range</p>
                                        <p className="text-muted-foreground text-sm">
                                            {new Date(report.period_start).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            {' — '}
                                            {new Date(report.period_end).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data preview */}
                    {previewData && (
                        <Card className="gap-0 overflow-hidden p-0">
                            <CardHeader className="border-border bg-muted/30 flex flex-row items-center gap-2 border-b px-6 py-4">
                                <BarChart2 className="text-primary size-4" />
                                <CardTitle className="flex-1 text-sm font-semibold">{previewData.title}</CardTitle>
                                <span className="text-muted-foreground text-xs">{previewData.period}</span>
                            </CardHeader>

                            {/* Summary stats */}
                            <div className="border-border grid grid-cols-2 gap-4 border-b px-6 py-4 md:grid-cols-3">
                                {Object.entries(previewData.summary).map(([key, val]) => (
                                    <div key={key} className="space-y-0.5">
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-foreground text-sm font-semibold">{String(val)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {previewData.headers.map(h => (
                                                <TableHead key={h} className="text-[10px] font-bold uppercase tracking-wide">
                                                    {h}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.rows.slice(0, 15).map((row, i) => (
                                            <TableRow key={i}>
                                                {row.map((cell, j) => (
                                                    <TableCell key={j} className="text-foreground text-xs">{String(cell)}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                        {previewData.rows.length > 15 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={previewData.headers.length}
                                                    className="text-muted-foreground py-3 text-center text-xs italic"
                                                >
                                                    +{previewData.rows.length - 15} more rows — download the full report for complete data
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}

                    {/* Activity timeline */}
                    <Card className="gap-0 p-6">
                        <h2 className="text-foreground mb-6 flex items-center gap-2 text-base font-semibold">
                            <Info className="text-muted-foreground size-4" /> Activity Timeline
                        </h2>
                        <div className="before:bg-border relative ml-4 space-y-6 before:absolute before:-ml-4 before:left-0 before:top-2 before:bottom-2 before:w-[2px]">
                            <div className="relative">
                                <div className="bg-primary border-background absolute -left-[21px] top-1 size-3 rounded-full border-4 shadow-sm" />
                                <div className="pl-4">
                                    <p className="text-foreground text-sm font-semibold">Generation Initiated</p>
                                    <p className="text-muted-foreground text-xs">{new Date(report.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            {report.approved_at && (
                                <div className="relative">
                                    <div className="bg-success border-background absolute -left-[21px] top-1 size-3 rounded-full border-4 shadow-sm" />
                                    <div className="pl-4">
                                        <p className="text-foreground text-sm font-semibold">Admin Approval Granted</p>
                                        <p className="text-muted-foreground text-xs">
                                            Approved by User #{report.approved_by} at {new Date(report.approved_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {report.status === 'completed' && (
                                <div className="relative">
                                    <div className="bg-info border-background absolute -left-[21px] top-1 size-3 rounded-full border-4 shadow-sm" />
                                    <div className="pl-4">
                                        <p className="text-foreground text-sm font-semibold">File Rendering Successful</p>
                                        <p className="text-muted-foreground text-xs">{new Date(report.generated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right — sidebar */}
                <div className="space-y-6">
                    {/* Parameters */}
                    <Card className="gap-0 p-6">
                        <h2 className="text-foreground mb-6 text-base font-semibold">Parameters</h2>
                        <div className="space-y-5">
                            {[
                                { icon: HardDrive,   label: 'Target Shop',     value: report.parameters.shop_id },
                                { icon: CheckCircle, label: 'Tax Inclusion',    value: report.parameters.include_tax ? 'Active' : 'Disabled' },
                                { icon: Clock,       label: 'Payment Mode',     value: report.parameters.payment_method || 'All Methods' },
                                { icon: Settings,    label: 'Engine',           value: 'Paynest v2.1' },
                            ].map(({ icon: ItemIcon, label, value }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted flex size-7 items-center justify-center rounded-md">
                                            <ItemIcon className="text-muted-foreground size-3.5" />
                                        </div>
                                        <span className="text-muted-foreground text-xs font-medium">{label}</span>
                                    </div>
                                    <span className="text-foreground text-xs font-bold uppercase">{value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Type badge */}
                    <Card className="bg-primary text-primary-foreground gap-0 p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <p className="text-primary-foreground/60 text-[10px] font-bold uppercase tracking-widest">Type</p>
                                <p className="text-sm font-semibold">{typeLabel}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Rejection reason */}
                    {report.rejection_reason && (
                        <Card className="border-destructive/30 bg-destructive/5 gap-0 p-5">
                            <h2 className="text-destructive mb-3 flex items-center gap-2 text-sm font-semibold italic">
                                <XCircle className="size-4" /> Rejection Feedback
                            </h2>
                            <p className="text-destructive border-destructive/20 border-l-2 pl-3 text-sm italic">
                                &apos;{report.rejection_reason}&apos;
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
