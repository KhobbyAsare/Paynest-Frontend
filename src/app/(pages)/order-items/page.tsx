/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Search,
    RefreshCcw,
    ShoppingCart,
    FilterX,
    XCircle,
    Package
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Modal,
    Form,
    Input as AntInput,
    InputNumber,
    Popconfirm,
    Select as AntSelect,
    Row,
    Col,
    Space,
    Typography,
    theme,
    Table,
} from "antd";
import type { ColumnsType } from 'antd/es/table';
import {
    GetOrderItems,
    GetAllOrderItems,
    CreateOrderItems,
    UpdateOrderItems,
    DeleteOrderItems
} from "@/(api-handlers)/orderItemsHandler";
import {
    GetProducts
} from "@/(api-handlers)/productsHandler";
import {
    OrderItemResponse,
    OrderItemRequest,
    UpdateOrderItemRequest
} from "@/interfaces/orderItems";
import {
    ProductResponse
} from "@/interfaces/products";
import {
    GetWalkinOrdersList
} from "@/(api-handlers)/orders_walkinsHandler";
import { OrderWalkInsResponse } from "@/interfaces/orders_walkins";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/(shared-components)/PageHeader";

const { Text } = Typography;

export default function OrderItemsPage() {
    const [orderItems, setOrderItems] = useState<OrderItemResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [orders, setOrders] = useState<OrderWalkInsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<OrderItemResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const { token } = theme.useToken();

    const [searchOrderId, setSearchOrderId] = useState<string>("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [productsData, ordersData] = await Promise.all([
                GetProducts(),
                GetWalkinOrdersList()
            ]);
            setProducts(productsData);
            setOrders(ordersData);

            if (searchOrderId && !isNaN(Number(searchOrderId))) {
                const itemsData = await GetOrderItems(Number(searchOrderId));
                setOrderItems(itemsData);
            } else {
                const itemsData = await GetAllOrderItems();
                setOrderItems(itemsData);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load order items or products");
        } finally {
            setLoading(false);
        }
    }, [searchOrderId]);

    useEffect(() => {
        fetchData();
    }, [fetchData, searchOrderId]);

    const showModal = (item: OrderItemResponse | null = null) => {
        setEditingItem(item);
        if (item) {
            form.setFieldsValue({
                ...item,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                quantity: 1,
                quantity_cancelled: 0,
                tax_rate: 0,
                discount_percentage: 0,
                item_status: 'pending'
            });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingItem(null);
        form.resetFields();
    };

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (editingItem) {
                const updateData: UpdateOrderItemRequest = {
                    quantity: Number(values.quantity),
                    quantity_cancelled: Number(values.quantity_cancelled || 0),
                    inventory_id: values.inventory_id ? Number(values.inventory_id) : undefined,
                    unit_price: values.unit_price ? Number(values.unit_price) : undefined,
                    tax_rate: values.tax_rate === undefined ? undefined : Number(values.tax_rate),
                    discount_percentage: values.discount_percentage === undefined ? undefined : Number(values.discount_percentage),
                    notes: values.notes || "",
                    item_status: values.item_status || "pending",
                };

                await UpdateOrderItems(editingItem.id, updateData);
                toast.success("Order item updated successfully");
            } else {
                const createData: OrderItemRequest = {
                    product_id: Number(values.product_id),
                    quantity: Number(values.quantity),
                    inventory_id: values.inventory_id ? Number(values.inventory_id) : undefined,
                    unit_price: values.unit_price ? Number(values.unit_price) : undefined,
                    tax_rate: values.tax_rate === undefined ? undefined : Number(values.tax_rate),
                    discount_percentage: values.discount_percentage === undefined ? undefined : Number(values.discount_percentage),
                    notes: values.notes || "",
                };

                await CreateOrderItems(createData, Number(values.target_order_id));
                toast.success("Order item created successfully");
            }
            handleCancel();
            fetchData();
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error(editingItem ? "Failed to update order item" : "Failed to create order item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await DeleteOrderItems(id);
            toast.success("Order item deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete order item");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'delivered':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'processing':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'pending':
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const filteredItems = orderItems.filter((item) => {
        const matchesSearch =
            item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.order_id?.toString().includes(searchTerm);

        const matchesStatus = selectedStatus === "all" || item.item_status?.toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const columns: ColumnsType<OrderItemResponse> = [
        {
            title: 'Order',
            key: 'order',
            render: (_, record) => (
                <div>
                    <div className="font-semibold text-slate-700">#{record.order_number || record.order_id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {record.order_id}</div>
                </div>
            ),
        },
        {
            title: 'Product',
            key: 'product',
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{record.product_name}</div>
                        <div className="text-xs text-slate-500 font-mono">SKU: {record.product_sku}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Inventory ID',
            dataIndex: 'inventory_id',
            key: 'inventory_id',
            render: (id) => <span className="text-slate-500 font-mono text-xs">{id || 'N/A'}</span>,
        },
        {
            title: 'Quantity',
            key: 'quantity',
            render: (_, record) => (
                <div>
                    <div>{record.quantity}</div>
                    {record.quantity_cancelled > 0 && (
                        <div className="text-xs text-rose-500">(-{record.quantity_cancelled} cancelled)</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            render: (value) => `₵${Number(value).toLocaleString()}`,
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (value) => <span className="font-semibold text-slate-900">₵${Number(value).toLocaleString()}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'item_status',
            key: 'item_status',
            render: (status) => (
                <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(status)}`}
                >
                    {status || 'Pending'}
                </Badge>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => <span className="text-slate-500">{new Date(date).toLocaleDateString()}</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-slate-100"
                        >
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                        <DropdownMenuItem onClick={() => showModal(record)} className="py-2 text-sm">
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Popconfirm
                            title="Delete Order Item"
                            description="Are you sure you want to delete this item?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true, size: 'small' }}
                        >
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 py-2 text-sm"
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                            </DropdownMenuItem>
                        </Popconfirm>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];



    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader title="Order Items" description="Manage individual items across all orders." />

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={fetchData}
                        disabled={loading}
                        className="shadow-sm hover:bg-slate-100 transition-all border-slate-200"
                    >
                        <RefreshCcw className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => showModal()}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all p-3"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add Order Item
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative w-full sm:w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Load Order ID..."
                        className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-md"
                        value={searchOrderId}
                        onChange={(e) => setSearchOrderId(e.target.value)}
                        type="number"
                    />
                </div>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search loaded items by product name, SKU..."
                        className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {(searchTerm !== "" || selectedStatus !== "all" || searchOrderId !== "") && (
                    <Button
                        variant="ghost"
                        onClick={() => { setSearchTerm(""); setSelectedStatus("all"); setSearchOrderId(""); }}
                        className="h-12 text-slate-500 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl px-4"
                    >
                        <FilterX className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredItems}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    className="ant-table-custom"
                />
            </div>

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <Space size="middle" align="center" className="mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            {editingItem ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                            <Text strong style={{ fontSize: '18px' }} className="block">
                                {editingItem ? "Edit Order Item" : "Create New Order Item"}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                {editingItem ? "Update existing item details" : "Add a new item to an order"}
                            </Text>
                        </div>
                    </Space>
                }
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" variant="outline" onClick={handleCancel} className="mr-3">
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        onClick={() => form.submit()}
                        disabled={submitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </Button>
                ]}
                width={600}
                centered
            >
                {/* Form Content */}
                <div className="max-h-[70vh] overflow-y-auto pt-2 pb-2 px-1">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <div className="mb-6">
                            <Text strong className="text-sm text-slate-700 flex items-center gap-2 mb-4">
                                <ShoppingCart className="h-4 w-4" />
                                Item Details
                            </Text>

                            {!editingItem && (
                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="target_order_id"
                                            label={<Text type="secondary">Select Order</Text>}
                                            rules={[{ required: true, message: 'Please select an order' }]}
                                        >
                                            <AntSelect
                                                showSearch
                                                placeholder="Search and select order..."
                                                optionFilterProp="children"
                                                filterOption={(input, option) =>
                                                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                                }
                                                className="rounded-lg w-full"
                                                options={orders.map(o => ({
                                                    value: o.id,
                                                    label: `Order #${o.order_number || o.id} - ${o.order_status} (₵${o.total_amount})`
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="product_id"
                                            label={<Text type="secondary">Select Product</Text>}
                                            rules={[{ required: true, message: 'Please select a product' }]}
                                        >
                                            <AntSelect
                                                showSearch
                                                placeholder="Search and select product..."
                                                optionFilterProp="children"
                                                filterOption={(input, option) =>
                                                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                                }
                                                className="rounded-lg w-full"
                                                options={products.map(p => ({
                                                    value: p.id,
                                                    label: `${p.name} (SKU: ${p.sku}) - ₵${p.selling_price}`
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        name="quantity"
                                        label={<Text type="secondary">Quantity</Text>}
                                        rules={[{ required: true, message: 'Quantity is required' }]}
                                    >
                                        <InputNumber min={1} className="w-full rounded-lg" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="unit_price"
                                        label={<Text type="secondary">Unit Price (Optional)</Text>}
                                    >
                                        <InputNumber min={0} className="w-full rounded-lg" placeholder="Override price..." />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        name="tax_rate"
                                        label={<Text type="secondary">Tax Rate (%)</Text>}
                                    >
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            className="w-full rounded-lg"
                                            formatter={(value) => `${value}%`}
                                            parser={(value) => value!.replace('%', '') as any}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="discount_percentage"
                                        label={<Text type="secondary">Discount (%)</Text>}
                                    >
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            className="w-full rounded-lg"
                                            formatter={(value) => `${value}%`}
                                            parser={(value) => value!.replace('%', '') as any}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        name="inventory_id"
                                        label={<Text type="secondary">Inventory ID (Optional)</Text>}
                                    >
                                        <InputNumber min={1} className="w-full rounded-lg" placeholder="Stock ID..." />
                                    </Form.Item>
                                </Col>
                                {editingItem && (
                                    <Col span={12}>
                                        <Form.Item
                                            name="item_status"
                                            label={<Text type="secondary">Status</Text>}
                                        >
                                            <AntSelect className="rounded-lg">
                                                <AntSelect.Option value="pending">Pending</AntSelect.Option>
                                                <AntSelect.Option value="processing">Processing</AntSelect.Option>
                                                <AntSelect.Option value="completed">Completed</AntSelect.Option>
                                                <AntSelect.Option value="delivered">Delivered</AntSelect.Option>
                                                <AntSelect.Option value="cancelled">Cancelled</AntSelect.Option>
                                            </AntSelect>
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>

                            {editingItem && (
                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="quantity_cancelled"
                                            label={<Text type="secondary">Quantity Cancelled</Text>}
                                        >
                                            <InputNumber min={0} className="w-full rounded-lg" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}

                            <Form.Item
                                name="notes"
                                label={<Text type="secondary">Notes</Text>}
                            >
                                <AntInput.TextArea
                                    rows={3}
                                    placeholder="Add any special instructions or notes..."
                                    className="rounded-lg"
                                />
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </Modal>
        </div>
    );
}
