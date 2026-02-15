/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState, useCallback } from 'react';
import {
    Button, Card, Table, Tag, Input, Badge, Tooltip,
    Modal, Space, Avatar
} from 'antd';
import {
    Search, Edit, Trash2,
    Mail, Phone, MapPin,
    Download, Filter, RefreshCcw,
    UserPlus, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GetAllCustomers, DeleteCustomer } from '@/(api-handlers)/customersHandler';
import { CustomerResponse } from '@/interfaces/customers';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import EmptyState from '@/components/(shared-components)/EmptyState';
import toast from 'react-hot-toast';
import Link from 'next/link';



export default function CustomerListPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<CustomerResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await GetAllCustomers();
            setCustomers(data);
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = (id: number, name: string) => {
        Modal.confirm({
            title: 'Delete Customer',
            content: `Are you sure you want to delete ${name}? This action cannot be undone.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No, Cancel',
            centered: true,
            onOk: async () => {
                try {
                    await DeleteCustomer(id);
                    toast.success('Customer deleted successfully');
                    fetchCustomers();
                } catch (error: any) {
                    handleErrorMessage(error, 'Failed to delete customer');
                }
            },
        });
    };

    const columns = [
        {
            title: 'Customer',
            key: 'customer',
            render: (record: CustomerResponse) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        className="bg-primary-light text-primary font-bold"
                    >
                        {record.first_name[0]}{record.last_name[0]}
                    </Avatar>
                    <div>
                        <div className="font-bold text-slate-900">{record.first_name} {record.last_name}</div>
                        <div className="text-xs text-slate-400 font-medium">{record.customer_code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (record: CustomerResponse) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="size-3" />
                        {record.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="size-3" />
                        {record.phone}
                    </div>
                </div>
            ),
        },
        {
            title: 'Location',
            key: 'location',
            render: (record: CustomerResponse) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-3" />
                    {record.city}{record.city && record.country ? ', ' : ''}{record.country}
                </div>
            ),
        },
        {
            title: 'Tier & Points',
            key: 'loyalty',
            render: (record: CustomerResponse) => (
                <div className="space-y-1">
                    <Tag color={record.loyalty_tier === 'Gold' ? 'gold' : record.loyalty_tier === 'Silver' ? 'silver' : 'blue'} className="rounded-full border-0 font-bold uppercase text-[10px]">
                        {record.loyalty_tier || 'Standard'}
                    </Tag>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                        <Star className="size-3 text-amber-500 fill-amber-500" />
                        {record.loyalty_points.toLocaleString()} Points
                    </div>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Badge
                    status={isActive ? "success" : "default"}
                    text={isActive ? "Active" : "Inactive"}
                />
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: CustomerResponse) => (
                <Space>
                    <Tooltip title="Edit Customer">
                        <Link href={`/customers/edit/${record.id}`}>
                            <Button
                                type="text"
                                icon={<Edit className="size-4 text-blue-600" />}
                            />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Delete Customer">
                        <Button
                            type="text"
                            icon={<Trash2 className="size-4 text-rose-600" />}
                            onClick={() => handleDelete(record.id, `${record.first_name} ${record.last_name}`)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredCustomers = customers.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Customer Relations"
                description="Manage your client base, loyalty programs, and communication preferences."
            >
                <div className="flex gap-3">
                    <Button
                        icon={<Download className="size-4" />}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl border-slate-200"
                    >
                        Export
                    </Button>
                    <Button
                        type="primary"
                        icon={<UserPlus className="size-4" />}
                        onClick={() => router.push('/customers/create')}
                        className="bg-primary hover:bg-primary/90 flex items-center gap-2 h-11 px-8 rounded-xl shadow-lg shadow-blue-100 font-bold"
                    >
                        Add Customer
                    </Button>
                </div>
            </PageHeader>

            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden mt-8" bodyStyle={{ padding: 0 }}>
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <Input
                            placeholder="Search by name, email or code..."
                            prefix={<Search className="size-4 text-slate-400" />}
                            className="max-w-md h-11 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button icon={<Filter className="size-4" />} className="h-11 px-4 rounded-xl">Filters</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            icon={<RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
                            onClick={fetchCustomers}
                            className="h-11 w-11 flex items-center justify-center rounded-xl border-slate-200"
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredCustomers}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10, className: "px-6" }}
                    className="custom-table"
                    locale={{
                        emptyText: (
                            <EmptyState
                                title={searchTerm ? "No customers found" : "No customers yet"}
                                description={searchTerm
                                    ? `We couldn't find any customers matching "${searchTerm}"`
                                    : "Your customer list is empty. Start by adding your first customer."
                                }
                                actionText={searchTerm ? "Clear Search" : "Add Customer"}
                                onAction={searchTerm ? () => setSearchTerm('') : () => router.push('/customers/create')}
                            />
                        )
                    }}
                />
            </Card>
        </div>
    );
}