"use client"

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Table, Tag, Space, Input, Badge, Tooltip, Dropdown, Checkbox } from 'antd';
import {
    Plus, Search, RefreshCcw,
    Download, ArrowUpRight,
    Package, AlertTriangle, XCircle, DollarSign,
    ChevronDown, Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { GetAllInventory, GetInventoryStatistics } from '@/(api-handlers)/inventoryHandler';
import { InventoryResponse, InventoryStats } from '@/interfaces/inventory';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}

export default function InventoryPage() {
    const router = useRouter();
    const [inventory, setInventory] = useState<InventoryResponse[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<{
        lowStock: boolean;
        outOfStock: boolean;
        needsReorder: boolean;
    }>({
        lowStock: false,
        outOfStock: false,
        needsReorder: false
    });

    const fetchInventoryData = useCallback(async () => {
        setLoading(true);
        try {
            const [inventoryData, statsData] = await Promise.all([
                GetAllInventory(filter.lowStock, filter.outOfStock, filter.needsReorder),
                GetInventoryStatistics()
            ]);
            setInventory(inventoryData);
            setStats(statsData);
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch inventory data');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchInventoryData();
    }, [filter, fetchInventoryData]);

    const statsConfig = stats ? [
        {
            name: 'Total Items',
            value: stats.total_items.toString(),
            change: 'Overall',
            changeType: 'neutral',
            icon: <Package className="size-5 text-blue-600" />
        },
        {
            name: 'Low Stock',
            value: stats.low_stock_items.toString(),
            change: stats.low_stock_items > 0 ? 'Action Required' : 'Healthy',
            changeType: stats.low_stock_items > 0 ? 'negative' : 'positive',
            icon: <AlertTriangle className="size-5 text-amber-500" />
        },
        {
            name: 'Out of Stock',
            value: stats.out_of_stock_items.toString(),
            change: stats.out_of_stock_items > 0 ? 'Critical' : 'Healthy',
            changeType: stats.out_of_stock_items > 0 ? 'negative' : 'positive',
            icon: <XCircle className="size-5 text-rose-500" />
        },
        {
            name: 'Inventory Value',
            value: `$${stats.total_inventory_value.toLocaleString()}`,
            change: '+2.5%',
            changeType: 'positive',
            icon: <DollarSign className="size-5 text-emerald-600" />
        },
    ] : [];

    const columns = [
        {
            title: 'Product ID',
            dataIndex: 'product_id',
            key: 'product_id',
            render: (id: number) => <span className="font-medium text-slate-700">#{id}</span>,
        },
        {
            title: 'Stock Level',
            key: 'stock',
            render: (record: InventoryResponse) => (
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold">{record.current_stock} units</span>
                        <div className="flex gap-1">
                            {record.is_out_of_stock && <Badge status="error" text="Out" />}
                            {record.is_low_stock && !record.is_out_of_stock && <Badge status="warning" text="Low" />}
                            {record.needs_reorder && <Badge status="processing" text="Reorder" />}
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={classNames(
                                'h-full transition-all duration-500',
                                record.is_out_of_stock ? 'bg-rose-500 w-0' :
                                    record.is_low_stock ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min((record.current_stock / (record.maximum_stock || 100)) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Location',
            key: 'location',
            render: (record: InventoryResponse) => (
                <div className="text-xs text-slate-500">
                    <div>{record.aisle || 'N/A'} - {record.shelf || 'N/A'}</div>
                    <div className="font-medium text-slate-700">{record.bin_location || 'No Bin'}</div>
                </div>
            ),
        },
        {
            title: 'Reorder Point',
            dataIndex: 'reorder_point',
            key: 'reorder_point',
            render: (val: number) => <Tag color="blue" className="rounded-full">{val} units</Tag>
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
            render: (record: InventoryResponse) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<ArrowUpRight className="size-4" />}
                            onClick={() => router.push(`/inventory/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Adjustment">
                        <Button
                            type="text"
                            icon={<RefreshCcw className="size-4" />}
                            className="text-amber-600"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredInventory = inventory.filter(item =>
        item.product_id.toString().includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Inventory Intelligence"
                description="Monitor stock levels, manage reorders, and optimize your inventory performance."
            >
                <div className="flex gap-3">
                    <Button
                        icon={<Download className="size-4" />}
                        className="flex items-center gap-2"
                    >
                        Export
                    </Button>
                    <Button
                        type="primary"
                        icon={<Plus className="size-4" />}
                        onClick={() => router.push('/inventory/create')}
                        className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                        Add Inventory
                    </Button>
                </div>
            </PageHeader>

            {/* Stats Grid - Requested Style */}
            <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-200 mt-8 mb-8 overflow-hidden rounded-2xl border border-gray-200 sm:grid-cols-2 lg:grid-cols-4 shadow-sm">
                {statsConfig.map((stat) => (
                    <div
                        key={stat.name}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-8 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            {stat.icon}
                            {stat.name}
                        </dt>
                        <dd
                            className={classNames(
                                stat.changeType === 'negative' ? 'text-rose-600' :
                                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-gray-500',
                                'text-xs font-semibold'
                            )}
                        >
                            {stat.change}
                        </dd>
                        <dd className="w-full flex-none text-3xl font-bold tracking-tight text-gray-900 mt-2">
                            {loading ? '...' : stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <Input
                            placeholder="Search by Product ID..."
                            prefix={<Search className="size-4 text-slate-400" />}
                            className="max-w-xs rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'lowStock',
                                            label: <Checkbox checked={filter.lowStock} onClick={(e) => e.stopPropagation()}>Low Stock</Checkbox>,
                                            onClick: () => setFilter(prev => ({ ...prev, lowStock: !prev.lowStock }))
                                        },
                                        {
                                            key: 'outOfStock',
                                            label: <Checkbox checked={filter.outOfStock} onClick={(e) => e.stopPropagation()}>Out of Stock</Checkbox>,
                                            onClick: () => setFilter(prev => ({ ...prev, outOfStock: !prev.outOfStock }))
                                        },
                                        {
                                            key: 'needsReorder',
                                            label: <Checkbox checked={filter.needsReorder} onClick={(e) => e.stopPropagation()}>Needs Reorder</Checkbox>,
                                            onClick: () => setFilter(prev => ({ ...prev, needsReorder: !prev.needsReorder }))
                                        },
                                    ]
                                }}
                                trigger={['click']}
                            >
                                <Button icon={<Filter className="size-4" />} className="flex items-center gap-2 rounded-lg">
                                    Stock Filters
                                    {(filter.lowStock || filter.outOfStock || filter.needsReorder) && (
                                        <Badge count={[filter.lowStock, filter.outOfStock, filter.needsReorder].filter(Boolean).length} size="small" />
                                    )}
                                    <ChevronDown className="size-4" />
                                </Button>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            icon={<RefreshCcw className={classNames("size-4", loading && "animate-spin")} />}
                            onClick={fetchInventoryData}
                            className="flex items-center justify-center rounded-lg border-slate-200"
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredInventory}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    className="inventory-table"
                />
            </Card>
        </div>
    );
}