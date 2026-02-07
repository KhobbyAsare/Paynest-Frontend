"use client";

import PageHeader from "@/components/(shared-components)/PageHeader";
import { useState, useEffect, useCallback } from "react";
import { AuditLogResponse } from "@/interfaces/auditLog";
import { getAllAuditLogs } from "@/(api-handlers)/auditLogHandler";
import { Button, Input, message, Tag, Table, Modal, Select, Space, Tooltip } from "antd";
import { SearchOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import Loading from "@/components/(shared-components)/Loading";
import EmptyState from "@/components/(shared-components)/EmptyState";

const { Option } = Select;

export default function SuperAdminView() {
    const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [total, setTotal] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Filters
    const [organizationId, setOrganizationId] = useState<number | undefined>(undefined);
    const [userId, setUserId] = useState<number | undefined>(undefined);
    const [action, setAction] = useState<string>("");
    const [entityType, setEntityType] = useState<string>("");
    const [entityId, setEntityId] = useState<string>("");

    // Modal
    const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (currentPage - 1) * pageSize;
            const data = await getAllAuditLogs(
                organizationId as any,
                userId as any,
                action,
                entityType,
                entityId,
                pageSize,
                offset
            );
            setAuditLogs(data);
            // Since the API doesn't return total count in the array, 
            // we'll have to manage it or wait for backend update.
            // For now, if we get a full page, assume there might be more.
            if (data.length === pageSize) {
                setTotal(currentPage * pageSize + pageSize);
            } else {
                setTotal((currentPage - 1) * pageSize + data.length);
            }
        } catch (error: any) {
            message.error('Failed to fetch audit logs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, organizationId, userId, action, entityType, entityId]);

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const resetFilters = () => {
        setOrganizationId(undefined);
        setUserId(undefined);
        setAction("");
        setEntityType("");
        setEntityId("");
        setCurrentPage(1);
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'user_email',
            key: 'user_email',
            render: (text: string, record: AuditLogResponse) => (
                <div>
                    <div className="font-medium text-gray-900">{text}</div>
                    <div className="text-xs text-gray-500 capitalize">{record.user_role}</div>
                </div>
            )
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => (
                <Tag color={
                    action.includes('delete') ? 'red' :
                        action.includes('update') || action.includes('edit') ? 'orange' :
                            action.includes('create') ? 'green' : 'blue'
                } className="capitalize">
                    {action}
                </Tag>
            )
        },
        {
            title: 'Entity',
            key: 'entity',
            render: (record: AuditLogResponse) => (
                <div>
                    <div className="text-sm font-medium">{record.entity_type}</div>
                    <div className="text-xs text-gray-400">ID: {record.entity_id}</div>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'success' ? 'success' : 'error'}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'IP Address',
            dataIndex: 'ip_address',
            key: 'ip_address',
            className: 'hidden md:table-cell'
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString(),
            sorter: true
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: AuditLogResponse) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedLog(record);
                        setIsDetailsModalVisible(true);
                    }}
                />
            )
        }
    ];

    const renderJson = (title: string, data: any) => {
        if (!data || Object.keys(data).length === 0 || (data.additionalProp1 && Object.keys(data.additionalProp1).length === 0)) {
            return null;
        }
        return (
            <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-700">{title}</h4>
                <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto text-xs border border-gray-200">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Logs" description="Track and monitor system-wide actions and security events." />

            {/* Filters */}
            <div className="bg-white p-4 rounded-md border shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                        <Input
                            placeholder="e.g. create_user"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
                        <Input
                            placeholder="e.g. Organization"
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Entity ID</label>
                        <Input
                            placeholder="Enter ID"
                            value={entityId}
                            onChange={(e) => setEntityId(e.target.value)}
                        />
                    </div>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={resetFilters}>Reset</Button>
                        <Button type="primary" icon={<FilterOutlined />} onClick={() => setCurrentPage(1)}>Filter</Button>
                    </Space>
                </div>
            </div>

            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={auditLogs}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        className: "px-6 py-4"
                    }}
                    onChange={handleTableChange}
                    className="audit-logs-table"
                />
            </div>

            {/* Details Modal */}
            <Modal
                title="Audit Log Details"
                open={isDetailsModalVisible}
                onCancel={() => setIsDetailsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={800}
            >
                {selectedLog && (
                    <div className="py-2">
                        <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
                            <div>
                                <p className="text-xs text-blue-600 font-medium">User</p>
                                <p className="text-sm font-semibold">{selectedLog.user_email}</p>
                                <p className="text-xs text-blue-500">{selectedLog.user_role} | {selectedLog.ip_address}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Action & Time</p>
                                <p className="text-sm font-semibold capitalize">{selectedLog.action.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-blue-500">{new Date(selectedLog.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Entity</p>
                                <p className="text-sm">{selectedLog.entity_type} (ID: {selectedLog.entity_id})</p>
                            </div>

                            {selectedLog.error_message && (
                                <div className="bg-red-50 p-3 rounded-md border border-red-100">
                                    <p className="text-xs text-red-600 font-medium">Error Message</p>
                                    <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderJson("Old Values", selectedLog.old_values)}
                                {renderJson("New Values", selectedLog.new_values)}
                            </div>

                            {renderJson("Full Changes", selectedLog.changes)}

                            <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400">
                                <p>User Agent: {selectedLog.user_agent}</p>
                                <p>Location: {selectedLog.location || 'Unknown'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <style jsx global>{`
                .audit-logs-table .ant-table-thead > tr > th {
                    background-color: #f9fafb;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #6b7280;
                    font-weight: 600;
                    padding: 0.75rem 1.5rem;
                }
                .audit-logs-table .ant-table-tbody > tr > td {
                    padding: 1rem 1.5rem;
                }
            `}</style>
        </div>
    );
}
