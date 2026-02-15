"use client"

import { useEffect, useState, use } from 'react';
import { Button, Card, Tag, Space, Divider, Typography, Breadcrumb, Tooltip, message } from 'antd';
import {
    FileText, Download, Calendar, Clock, CheckCircle, XCircle,
    ArrowLeft, Printer, Share2, ExternalLink, HardDrive, Info,
    Eye, Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReportResponse, ReportStatus } from '@/interfaces/report';
import { getReportByID, downloadReport } from '@/(api-handlers)/reportHandler';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

const { Title, Text } = Typography;

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloading, setDownloading] = useState<boolean>(false);

    const reportTypes = [
        { value: 'daily_sales', label: 'Daily Sales Report' },
        { value: 'monthly_financial', label: 'Monthly Financial Report' },
        { value: 'inventory', label: 'Inventory Report' },
        { value: 'employee_performance', label: 'Employee Performance Report' },
        { value: 'customer_analytics', label: 'Customer Analytics Report' },
    ];

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await getReportByID(Number.parseInt(id));
            setReport(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch report details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [id]);

    const formatFileSize = (bytes: number): string => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusConfig = (status: ReportStatus) => {
        const configs: Record<string, { color: string; icon: React.ReactElement; text: string; bg: string }> = {
            pending: { color: 'gold', icon: <Clock className="size-4" />, text: 'Pending Approval', bg: 'bg-amber-50' },
            approved: { color: 'blue', icon: <CheckCircle className="size-4" />, text: 'Approved', bg: 'bg-blue-50' },
            processing: { color: 'processing', icon: <Clock className="size-4" />, text: 'Processing', bg: 'bg-indigo-50' },
            completed: { color: 'success', icon: <CheckCircle className="size-4" />, text: 'Completed', bg: 'bg-emerald-50' },
            failed: { color: 'error', icon: <XCircle className="size-4" />, text: 'Failed', bg: 'bg-rose-50' },
            rejected: { color: 'error', icon: <XCircle className="size-4" />, text: 'Rejected', bg: 'bg-rose-50' },
        };
        return configs[status] || configs.pending;
    };

    const handleDownload = async () => {
        if (!report || report.status !== 'completed') return;
        setDownloading(true);
        const fileName = `${report.report_name.replaceAll(/\s+/g, '_')}_${report.id}.${report.file_format}`;
        try {
            await downloadReport(report.id, fileName);
            message.success('Download started');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to download report');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        globalThis.print();
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loading text="Loading report intelligence..." /></div>;
    if (!report) return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <EmptyState
                title="Report Not Found"
                description="The report you are looking for might have been deleted or moved."
                actions={<Button icon={<ArrowLeft className="size-4" />} onClick={() => router.back()}>Go Back</Button>}
            />
        </div>
    );

    const statusConfig = getStatusConfig(report.status);

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <Breadcrumb className="mb-4 text-xs">
                    <Breadcrumb.Item><Link href="/report">Reports</Link></Breadcrumb.Item>
                    <Breadcrumb.Item>{report.report_name}</Breadcrumb.Item>
                </Breadcrumb>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                            <FileText className="size-8 text-primary" />
                        </div>
                        <div>
                            <Title level={2} className="!mb-1 text-slate-800 tracking-tight">{report.report_name}</Title>
                            <div className="flex items-center gap-2 flex-wrap text-slate-500 text-sm">
                                <Tag color="blue" className="rounded-full px-3 m-0">
                                    {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
                                </Tag>
                                <span className="flex items-center gap-1"><Calendar className="size-3" /> Requested {new Date(report.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <Space size="middle" className="flex-shrink-0">
                        <Button
                            icon={<Printer className="size-4" />}
                            className="flex items-center gap-2 rounded-lg border-slate-200"
                            onClick={handlePrint}
                        >
                            Print Details
                        </Button>
                        <Button
                            type="primary"
                            icon={<Download className="size-4" />}
                            onClick={handleDownload}
                            loading={downloading}
                            disabled={report.status !== 'completed'}
                            className="flex items-center gap-2 bg-primary rounded-lg h-10 px-6 shadow-md shadow-blue-100"
                        >
                            Download Report
                        </Button>
                    </Space>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Alert Banner */}
                    <Card className={`${statusConfig.bg} border-0 shadow-sm rounded-2xl overflow-hidden`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${report.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {statusConfig.icon}
                            </div>
                            <div>
                                <Text className="font-semibold text-slate-800 block mb-1">Current Status: {statusConfig.text}</Text>
                                <div className="text-xs text-slate-600 mb-0 leading-relaxed">
                                    {report.status === 'completed'
                                        ? "This report has been successfully generated and is ready for analysis. You can download it in the format requested."
                                        : report.status === 'pending'
                                            ? "The generation request is currently awaiting administrator review. You will be notified once it is approved."
                                            : "The report is currently being processed by our generation engine. This might take a few moments depending on the data size."}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Report Preview / Content Summary */}
                    <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden" bodyStyle={{ padding: 0 }}>
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <span className="font-semibold text-slate-700 flex items-center gap-2"><Eye className="size-4" /> Report Summary Intelligence</span>
                            <div className="flex items-center gap-2">
                                <Tooltip title="Configuration"><Settings className="size-4 text-slate-400 cursor-pointer" /></Tooltip>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Format</Text>
                                    <Text className="block text-lg font-semibold text-slate-800 uppercase italic">{report.file_format}</Text>
                                </div>
                                <div className="space-y-1">
                                    <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Size</Text>
                                    <Text className="block text-lg font-semibold text-slate-800">{formatFileSize(report.file_size)}</Text>
                                </div>
                                <div className="space-y-1">
                                    <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pages</Text>
                                    <Text className="block text-lg font-semibold text-slate-800">12 (Est.)</Text>
                                </div>
                                <div className="space-y-1">
                                    <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expiration</Text>
                                    <Text className="block text-lg font-semibold text-slate-800">{report.expires_at ? new Date(report.expires_at).toLocaleDateString() : 'None'}</Text>
                                </div>
                            </div>

                            <Divider className="my-8 border-slate-100" />

                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    <div>
                                        <Text className="font-medium text-slate-700 block">Organization Context</Text>
                                        <Text className="text-sm text-slate-500">Generated for Organization ID #{report.organization_id} by User #{report.generated_by}</Text>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="size-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                                    <div>
                                        <Text className="font-medium text-slate-700 block">Temporal Range</Text>
                                        <Text className="text-sm text-slate-500">{new Date(report.period_start).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} — {new Date(report.period_end).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Meta Logs / Timeline */}
                    <Card className="rounded-2xl shadow-sm border-slate-100 p-6">
                        <Title level={5} className="!mb-6 text-slate-800 flex items-center gap-2"><Info className="size-4 text-slate-400" /> Activity Timeline</Title>
                        <div className="space-y-6 relative ml-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:-ml-4">
                            <div className="relative">
                                <div className="absolute size-3 rounded-full bg-primary border-4 border-white shadow-sm -left-[21px] top-1" />
                                <div className="pl-4">
                                    <Text className="text-sm font-semibold text-slate-800">Generation Initiated</Text>
                                    <Text className="block text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</Text>
                                </div>
                            </div>
                            {report.approved_at && (
                                <div className="relative">
                                    <div className="absolute size-3 rounded-full bg-emerald-500 border-4 border-white shadow-sm -left-[21px] top-1" />
                                    <div className="pl-4">
                                        <Text className="text-sm font-semibold text-slate-800">Admin Approval Granted</Text>
                                        <Text className="block text-xs text-slate-500">Approved by User #{report.approved_by} at {new Date(report.approved_at).toLocaleString()}</Text>
                                    </div>
                                </div>
                            )}
                            {report.status === 'completed' && (
                                <div className="relative">
                                    <div className="absolute size-3 rounded-full bg-indigo-500 border-4 border-white shadow-sm -left-[21px] top-1" />
                                    <div className="pl-4">
                                        <Text className="text-sm font-semibold text-slate-800">File Rendering Successful</Text>
                                        <Text className="block text-xs text-slate-500">{new Date(report.generated_at).toLocaleString()}</Text>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Configuration */}
                <div className="space-y-6">
                    <Card className="rounded-2xl shadow-sm border-slate-100 p-6 bg-white overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 size-24 bg-slate-50 rounded-full flex-shrink-0" />
                        <Title level={5} className="mb-6! text-slate-800 relative">Parameters Used</Title>
                        <div className="space-y-5 relative">
                            {[
                                { icon: <HardDrive className="size-4" />, label: "Target Shop ID", value: report.parameters.shop_id },
                                { icon: <CheckCircle className="size-4" />, label: "Tax Inclusion", value: report.parameters.include_tax ? "Active" : "Disabled" },
                                { icon: <Clock className="size-4" />, label: "Payment Mode", value: report.parameters.payment_method || 'All Methods' },
                                { icon: <Settings className="size-4" />, label: "Generation Engine", value: "Paynest v2.1" }
                            ].map((item, idx) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded-md text-slate-400">{item.icon}</div>
                                        <Text className="text-xs text-slate-500 font-medium">{item.label}</Text>
                                    </div>
                                    <Text className="text-xs font-bold text-slate-800 uppercase">{item.value}</Text>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Quick Access Card */}
                    <Card className="rounded-2xl shadow-blue-600/5 shadow-2xl border-0 !bg-slate-900 text-white p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><FileText className="size-24" /></div>
                        <Title level={5} className="!text-white !mb-4">Reporting Actions</Title>
                        <div className="space-y-3 relative">
                            <Button
                                className="w-full justify-start gap-3 h-11 rounded-lg bg-white/10 border-0 text-white hover:!bg-white/20 hover:!text-white flex items-center"
                                icon={<ExternalLink className="size-4" />}
                                onClick={() => report.file_url && window.open(report.file_url, '_blank')}
                                disabled={!report.file_url}
                            >
                                Open Source File
                            </Button>
                            <Button
                                className="w-full justify-start gap-3 h-11 rounded-lg bg-white/10 border-0 text-white hover:!bg-white/20 hover:!text-white flex items-center"
                                icon={<Share2 className="size-4" />}
                            >
                                Share Intelligence
                            </Button>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10 text-center">
                            <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-none">Intelligence Generated by Paynest POS</Text>
                        </div>
                    </Card>

                    {report.rejection_reason && (
                        <Card className="rounded-2xl shadow-sm border-rose-100 bg-rose-50/30 p-6">
                            <Title level={5} className="text-rose-800! !mb-4 flex items-center gap-2 italic"><XCircle className="size-4" /> Rejection Feedback</Title>
                            <Text className="text-sm text-rose-700 italic block border-l-2 border-rose-200 pl-3">
                                &apos;{report.rejection_reason}&apos;
                            </Text>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
