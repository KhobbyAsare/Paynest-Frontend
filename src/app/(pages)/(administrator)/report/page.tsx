"use client"

import { useEffect, useState } from 'react';
import { Modal, Input, Button, Card, message, Select, Tag, Tooltip, Space, Badge, Descriptions } from 'antd';
import { FileText, Download, Calendar, Search, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { ReportResponse, ReportStatus } from '@/interfaces/report';
import { getAllReports, getReportByID, downloadReport } from '@/(api-handlers)/reportHandler';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

const { Option } = Select;

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function AdminAllReportsView() {
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Preview Modal state
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
    const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);

    const reportTypes = [
        { value: 'daily_sales', label: 'Daily Sales Report' },
        { value: 'monthly_financial', label: 'Monthly Financial Report' },
        { value: 'inventory', label: 'Inventory Report' },
        { value: 'employee_performance', label: 'Employee Performance Report' },
        { value: 'customer_analytics', label: 'Customer Analytics Report' },
    ];

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getAllReports();
            setReports(data);
            setFilteredReports(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch reports');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        let filtered = reports;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(report =>
                report.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.report_type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(report => report.status === statusFilter);
        }

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(report => report.report_type === typeFilter);
        }

        setFilteredReports(filtered);
    }, [searchTerm, statusFilter, typeFilter, reports]);

    const handlePreview = async (reportId: number) => {
        setPreviewLoading(true);
        try {
            const report = await getReportByID(reportId);
            setSelectedReport(report);
            setIsPreviewModalOpen(true);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch report details');
            console.error(error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const getStatusBadge = (status: ReportStatus) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactElement; text: string }> = {
            pending: { color: 'warning', icon: <Clock className="size-3" />, text: 'Pending Approval' },
            approved: { color: 'processing', icon: <CheckCircle className="size-3" />, text: 'Approved' },
            rejected: { color: 'error', icon: <XCircle className="size-3" />, text: 'Rejected' },
            processing: { color: 'processing', icon: <Clock className="size-3" />, text: 'Processing' },
            completed: { color: 'success', icon: <CheckCircle className="size-3" />, text: 'Completed' },
            failed: { color: 'error', icon: <XCircle className="size-3" />, text: 'Failed' },
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <Badge
                status={config.color as 'success' | 'processing' | 'error' | 'warning' | 'default'}
                text={
                    <span className="flex items-center gap-1">
                        {config.icon}
                        {config.text}
                    </span>
                }
            />
        );
    };

    const handleDownload = async (report: ReportResponse) => {
        if (report.status !== 'completed') {
            message.warning('Report file is not available until it is completed.');
            return;
        }

        const fileName = `${report.report_name.replace(/\s+/g, '_')}_${report.id}.${report.file_format}`;

        try {
            await downloadReport(report.id, fileName);
            message.success('Download started');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to download report');
        }
    };



    return (
        <div className="p-4">
            <PageHeader
                title='All Organization Reports'
                description='View and download all generated reports for your organization.'
            />

            {/* Filters Section */}
            <Card className="mt-6 border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Input
                        placeholder="Search reports..."
                        prefix={<Search className="size-4 text-gray-400" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="sm:w-64"
                    />
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="sm:w-48"
                        placeholder="Filter by status"
                    >
                        <Option value="all">All Statuses</Option>
                        <Option value="pending">Pending Approval</Option>
                        <Option value="approved">Approved</Option>
                        <Option value="processing">Processing</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="rejected">Rejected</Option>
                        <Option value="failed">Failed</Option>
                    </Select>
                    <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        className="sm:w-64"
                        placeholder="Filter by type"
                    >
                        <Option value="all">All Types</Option>
                        {reportTypes.map(type => (
                            <Option key={type.value} value={type.value}>{type.label}</Option>
                        ))}
                    </Select>
                </div>
            </Card>

            {/* Reports Table */}
            <Card className="mt-6 border-gray-200 shadow-sm">
                <div className="flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            Report Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Type
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Period
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Created At
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-10">
                                                <Loading text="Fetching reports..." />
                                            </td>
                                        </tr>
                                    ) : filteredReports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-10">
                                                <EmptyState
                                                    title="No reports found"
                                                    description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                                        ? "No reports match your filters."
                                                        : "No reports have been generated yet."}
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReports.map((report) => (
                                            <tr key={report.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="size-4 text-gray-400" />
                                                        {report.report_name}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <Tag color="blue">
                                                        {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
                                                    </Tag>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="size-4 text-gray-400" />
                                                        {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {getStatusBadge(report.status)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <Space>
                                                        <Tooltip title="Preview Report">
                                                            <Button
                                                                type="text"
                                                                icon={<Eye className="size-4" />}
                                                                onClick={() => handlePreview(report.id)}
                                                                className="flex items-center justify-center text-blue-500 hover:text-blue-600"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="Download Report">
                                                            <Button
                                                                type="text"
                                                                icon={<Download className="size-4" />}
                                                                onClick={() => handleDownload(report)}
                                                                disabled={report.status !== 'completed'}
                                                                className="flex items-center justify-center"
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Preview Report Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <Eye className="size-5 text-primary" />
                        <span>Report Details Preview</span>
                    </div>
                }
                open={isPreviewModalOpen}
                onCancel={() => setIsPreviewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsPreviewModalOpen(false)}>
                        Close
                    </Button>,
                    <Button
                        key="download"
                        type="primary"
                        icon={<Download className="size-4" />}
                        onClick={() => selectedReport && handleDownload(selectedReport)}
                        disabled={selectedReport?.status !== 'completed'}
                        className="bg-primary"
                    >
                        Download
                    </Button>
                ]}
                width={700}
                loading={previewLoading}
            >
                {selectedReport && (
                    <div className="mt-4">
                        <Descriptions title="General Information" bordered column={1}>
                            <Descriptions.Item label="Report Name">{selectedReport.report_name}</Descriptions.Item>
                            <Descriptions.Item label="Report Type">
                                <Tag color="blue">
                                    {reportTypes.find(t => t.value === selectedReport.report_type)?.label || selectedReport.report_type}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">{getStatusBadge(selectedReport.status)}</Descriptions.Item>
                            <Descriptions.Item label="Period">
                                {new Date(selectedReport.period_start).toLocaleDateString()} - {new Date(selectedReport.period_end).toLocaleDateString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Created At">{new Date(selectedReport.created_at).toLocaleString()}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Parameters" bordered column={1} className="mt-6">
                            <Descriptions.Item label="Shop ID">{selectedReport.parameters.shop_id}</Descriptions.Item>
                            <Descriptions.Item label="Include Tax">{selectedReport.parameters.include_tax ? "Yes" : "No"}</Descriptions.Item>
                            <Descriptions.Item label="Payment Method">{selectedReport.parameters.payment_method}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="File Information" bordered column={1} className="mt-6">
                            <Descriptions.Item label="File Format">{selectedReport.file_format.toUpperCase()}</Descriptions.Item>
                            <Descriptions.Item label="File Size">{formatFileSize(selectedReport.file_size)}</Descriptions.Item>
                            <Descriptions.Item label="File URL">
                                {selectedReport.file_url ? (
                                    <a href={selectedReport.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                        {selectedReport.file_url}
                                    </a>
                                ) : "N/A"}
                            </Descriptions.Item>
                        </Descriptions>

                        {(selectedReport.approved_by || selectedReport.rejection_reason) && (
                            <Descriptions title="Approval Information" bordered column={1} className="mt-6">
                                <Descriptions.Item label="Approved By">{selectedReport.approved_by || "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Approved At">{selectedReport.approved_at ? new Date(selectedReport.approved_at).toLocaleString() : "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Rejection Reason">{selectedReport.rejection_reason || "None"}</Descriptions.Item>
                            </Descriptions>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}