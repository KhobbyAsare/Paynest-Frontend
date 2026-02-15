"use client"

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Card, message, Select, DatePicker, Tag, Tooltip, Badge, Space } from 'antd';
import { Plus, FileText, Calendar, Search, Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { ReportFileFormat, ReportRequest, ReportResponse, ReportStatus, ReportType } from '@/interfaces/report';
import { createReport, getMyResports, downloadReport } from '@/(api-handlers)/reportHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import Link from 'next/link';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ManagerReportView() {
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [form] = Form.useForm();
    const { user } = useAuthStore();

    const reportTypes = [
        { value: 'daily_sales', label: 'Daily Sales Report' },
        { value: 'monthly_financial', label: 'Monthly Financial Report' },
        { value: 'inventory', label: 'Inventory Report' },
        { value: 'employee_performance', label: 'Employee Performance Report' },
        { value: 'customer_analytics', label: 'Customer Analytics Report' },
    ];

    const fileFormats = [
        { value: 'pdf', label: 'PDF' },
        { value: 'excel', label: 'Excel' },
        { value: 'csv', label: 'CSV' },
        { value: "json", label: "JSON" }
    ];

    const paymentMethods = [
        { value: 'all', label: 'All Payment Methods' },
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'mobile_money', label: 'Mobile Money' },
    ];

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

    const fetchShops = async () => {
        try {
            const data = await getOrganizationShops();
            setShops(data);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch shops');
        }
    };

    useEffect(() => {
        fetchReports();
        fetchShops();
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

    interface ReportFormValues {
        report_type: string;
        report_name: string;
        report_period?: string;
        shop_id: number;
        include_tax?: boolean;
        payment_method?: string;
        file_format: string;
        date_range: { format: (format: string) => string }[];
    }

    const handleCreateReport = async (values: ReportFormValues) => {
        setConfirmLoading(true);
        try {
            const reportData: ReportRequest = {
                report_type: values.report_type as ReportType,
                report_name: values.report_name,
                report_period: values.report_period || 'custom',
                parameters: {
                    shop_id: values.shop_id,
                    include_tax: values.include_tax || false,
                    payment_method: values.payment_method || 'all',
                },
                file_format: values.file_format as ReportFileFormat,
                period_start: values.date_range[0].format('YYYY-MM-DD'),
                period_end: values.date_range[1].format('YYYY-MM-DD'),
                organization_id: user?.organization?.id || 0,
            };

            await createReport(reportData);
            message.success('Report generation request submitted successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchReports();
        } catch (error: unknown) {
            const isAxiosError = error && typeof error === 'object' && 'response' in error;
            const errorMessage = isAxiosError
                ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create report')
                : 'Failed to create report';
            message.error(errorMessage);
            console.error(error);
        } finally {
            setConfirmLoading(false);
        }
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
                title='Organization Reports'
                description='Generate and manage comprehensive reports for your organization.'
            >
                <Button
                    type="primary"
                    icon={<Plus className="size-4" />}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                >
                    Generate Report
                </Button>
            </PageHeader>

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
                                            <td colSpan={7} className="py-10">
                                                <EmptyState
                                                    title="No reports found"
                                                    description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                                        ? "No reports match your filters. Try adjusting your search criteria."
                                                        : "You haven't generated any reports yet. Click the button above to create one."}
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
                                                        <Tooltip title="View Intelligence">
                                                            <Link href={`/report/${report.id}`}>
                                                                <Button
                                                                    type="text"
                                                                    icon={<Eye className="size-4" />}
                                                                    className="flex items-center justify-center text-blue-500 hover:text-blue-600"
                                                                />
                                                            </Link>
                                                        </Tooltip>
                                                        <Tooltip title="Download Report">
                                                            <Button
                                                                type="text"
                                                                icon={<Download className="size-4 text-primary" />}
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

            {/* Create Report Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        <span>Generate New Report</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
                className="top-20"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateReport}
                    className="mt-4"
                >
                    <Form.Item
                        name="report_name"
                        label="Report Name"
                        rules={[{ required: true, message: 'Please enter report name' }]}
                    >
                        <Input placeholder="Q1 Sales Report" />
                    </Form.Item>

                    <Form.Item
                        name="report_type"
                        label="Report Type"
                        rules={[{ required: true, message: 'Please select report type' }]}
                    >
                        <Select placeholder="Select report type">
                            {reportTypes.map(type => (
                                <Option key={type.value} value={type.value}>{type.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="date_range"
                        label="Report Period"
                        rules={[{ required: true, message: 'Please select date range' }]}
                    >
                        <RangePicker className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="shop_id"
                        label="Shop"
                        rules={[{ required: true, message: 'Please select a shop' }]}
                    >
                        <Select placeholder="Select shop">
                            {shops.map(shop => (
                                <Option key={shop.id} value={shop.id}>{shop.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="payment_method"
                        label="Payment Method"
                        initialValue="all"
                    >
                        <Select placeholder="Select payment method">
                            {paymentMethods.map(method => (
                                <Option key={method.value} value={method.value}>{method.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="file_format"
                        label="File Format"
                        rules={[{ required: true, message: 'Please select file format' }]}
                        initialValue="pdf"
                    >
                        <Select placeholder="Select file format">
                            {fileFormats.map(format => (
                                <Option key={format.value} value={format.value}>{format.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="include_tax"
                        label="Include Tax"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Select defaultValue={true}>
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => {
                            setIsModalOpen(false);
                            form.resetFields();
                        }}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={confirmLoading}
                            className="bg-primary"
                            icon={<Plus className="size-4" />}
                        >
                            Generate Report
                        </Button>
                    </div>
                </Form>
            </Modal>



        </div>
    );
}