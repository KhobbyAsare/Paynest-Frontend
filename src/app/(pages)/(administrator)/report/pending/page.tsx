"use client"

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Card, message, Select, Tag, Tooltip, Space, Badge, Descriptions } from 'antd';
import { FileText, Calendar, Search, Clock, CheckCircle, XCircle, Eye, Check, X, AlertCircle } from 'lucide-react';
import { ApproveReportRequest, ReportResponse, ReportStatus } from '@/interfaces/report';
import { getPendingReports, getApprovedReports, getReportByID } from '@/(api-handlers)/reportHandler';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

const { Option } = Select;

export default function PendingReportsView() {
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Modals state
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

    const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);

    const [approveForm] = Form.useForm();
    const [rejectForm] = Form.useForm();

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
            const data = await getPendingReports();
            setReports(data);
            setFilteredReports(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch pending reports');
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

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(report => report.report_type === typeFilter);
        }

        setFilteredReports(filtered);
    }, [searchTerm, typeFilter, reports]);

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

    const handleApproveClick = (report: ReportResponse) => {
        setSelectedReport(report);
        setIsApproveModalOpen(true);
    };

    const handleRejectClick = (report: ReportResponse) => {
        setSelectedReport(report);
        setIsRejectModalOpen(true);
    };

    const handleApproveSubmit = async (values: { comments: string }) => {
        if (!selectedReport) return;
        setActionLoading(true);
        try {
            const approveData: ApproveReportRequest = {
                approved: true,
                rejection_reason: '',
                comments: values.comments || 'Report request approved'
            };

            await getApprovedReports(selectedReport.id, approveData);
            message.success('Report request approved successfully');
            setIsApproveModalOpen(false);
            approveForm.resetFields();
            fetchReports();
        } catch (error: unknown) {
            message.error('Failed to approve report');
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSubmit = async (values: { rejection_reason: string; comments: string }) => {
        if (!selectedReport) return;
        setActionLoading(true);
        try {
            const rejectData: ApproveReportRequest = {
                approved: false,
                rejection_reason: values.rejection_reason,
                comments: values.comments || 'Report request rejected'
            };

            await getApprovedReports(selectedReport.id, rejectData);
            message.success('Report request rejected');
            setIsRejectModalOpen(false);
            rejectForm.resetFields();
            fetchReports();
        } catch (error: unknown) {
            message.error('Failed to reject report');
            console.error(error);
        } finally {
            setActionLoading(false);
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



    return (
        <div className="p-4">
            <PageHeader
                title='Pending Report Requests'
                description='Review and manage pending report generation requests from your organization.'
            />

            {/* Filters Section */}
            <Card className="mt-6 border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        placeholder="Search by name or type..."
                        prefix={<Search className="size-4 text-gray-400" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="sm:w-64"
                    />
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
                                                <Loading text="Fetching pending reports..." />
                                            </td>
                                        </tr>
                                    ) : filteredReports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-10">
                                                <EmptyState
                                                    title="No pending requests"
                                                    description={searchTerm || typeFilter !== 'all'
                                                        ? "No pending reports match your filters."
                                                        : "There are currently no report generation requests awaiting approval."}
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
                                                        <Tooltip title="Preview Request">
                                                            <Button
                                                                type="text"
                                                                icon={<Eye className="size-4" />}
                                                                onClick={() => handlePreview(report.id)}
                                                                className="flex items-center justify-center text-blue-500 hover:text-blue-600"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="Approve Request">
                                                            <Button
                                                                type="text"
                                                                icon={<Check className="size-4" />}
                                                                onClick={() => handleApproveClick(report)}
                                                                className="flex items-center justify-center text-green-500 hover:text-green-600"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="Reject Request">
                                                            <Button
                                                                type="text"
                                                                icon={<X className="size-4" />}
                                                                onClick={() => handleRejectClick(report)}
                                                                className="flex items-center justify-center text-red-500 hover:text-red-600"
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

            {/* Preview Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <Eye className="size-5 text-primary" />
                        <span>Report Request Preview</span>
                    </div>
                }
                open={isPreviewModalOpen}
                onCancel={() => setIsPreviewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsPreviewModalOpen(false)}>
                        Close
                    </Button>,
                    <Button
                        key="approve"
                        type="primary"
                        onClick={() => {
                            setIsPreviewModalOpen(false);
                            if (selectedReport) handleApproveClick(selectedReport);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Approve
                    </Button>
                ]}
                width={700}
                loading={previewLoading}
            >
                {selectedReport && (
                    <div className="mt-4">
                        <Descriptions title="Request Information" bordered column={1}>
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
                            <Descriptions.Item label="Requested At">{new Date(selectedReport.created_at).toLocaleString()}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Parameters" bordered column={1} className="mt-6">
                            <Descriptions.Item label="Shop ID">{selectedReport.parameters.shop_id}</Descriptions.Item>
                            <Descriptions.Item label="Include Tax">{selectedReport.parameters.include_tax ? "Yes" : "No"}</Descriptions.Item>
                            <Descriptions.Item label="Payment Method">{selectedReport.parameters.payment_method}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Output Format" bordered column={1} className="mt-6">
                            <Descriptions.Item label="File Format">{selectedReport.file_format.toUpperCase()}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>

            {/* Approve Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <CheckCircle className="size-5 text-green-500" />
                        <span>Approve Report Request</span>
                    </div>
                }
                open={isApproveModalOpen}
                onCancel={() => setIsApproveModalOpen(false)}
                footer={null}
                width={500}
            >
                <div className="mb-4">
                    <p className="text-gray-600">Are you sure you want to approve the generation of <strong>{selectedReport?.report_name}</strong>?</p>
                </div>
                <Form
                    form={approveForm}
                    layout="vertical"
                    onFinish={handleApproveSubmit}
                >
                    <Form.Item
                        name="comments"
                        label="Comments (Optional)"
                    >
                        <Input.TextArea rows={3} placeholder="Add any comments for the requester..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsApproveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                            icon={<Check className="size-4" />}
                        >
                            Confirm Approval
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Reject Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <XCircle className="size-5 text-red-500" />
                        <span>Reject Report Request</span>
                    </div>
                }
                open={isRejectModalOpen}
                onCancel={() => setIsRejectModalOpen(false)}
                footer={null}
                width={500}
            >
                <div className="mb-4">
                    <p className="text-gray-600">Please provide a reason for rejecting the report request for <strong>{selectedReport?.report_name}</strong>.</p>
                </div>
                <Form
                    form={rejectForm}
                    layout="vertical"
                    onFinish={handleRejectSubmit}
                >
                    <Form.Item
                        name="rejection_reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
                    >
                        <Input.TextArea rows={3} placeholder="Example: Incorrect date range or parameters selected." />
                    </Form.Item>

                    <Form.Item
                        name="comments"
                        label="Additional Comments (Optional)"
                    >
                        <Input.TextArea rows={2} placeholder="Any other notes..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsRejectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            htmlType="submit"
                            loading={actionLoading}
                            icon={<X className="size-4" />}
                        >
                            Reject Request
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}