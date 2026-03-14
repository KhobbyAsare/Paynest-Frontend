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
    Banknote,
    FilterX,
    CreditCard,
    Smartphone,
    Building2,
    CheckCircle2,
    Receipt,
    ShoppingBag
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Modal,
    Form,
    Input as AntInput,
    InputNumber,
    Popconfirm,
    Row,
    Col,
    Space,
    Typography,
    Table,
} from "antd";
import type { ColumnsType } from 'antd/es/table';
import {
    GetAllPayments,
    GetPaymentsByOrderId,
    CreatePayment,
    UpdatePayment,
    DeletePayment
} from "@/(api-handlers)/paymentsHandler";
import {
    GetWalkinOrdersList
} from "@/(api-handlers)/orders_walkinsHandler";
import {
    getOrganizationUsers
} from "@/(api-handlers)/userHandler";
import { OrderWalkInsResponse } from "@/interfaces/orders_walkins";
import {
    PaymentResponse,
    PaymentRequest,
    PaymentUpdateRequest
} from "@/interfaces/payments";
import { UserResponse } from "@/interfaces/loginInterface";
import { getOrganizationShops } from "@/(api-handlers)/organizationShopsHandler";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/(shared-components)/PageHeader";

const { Text } = Typography;

export default function PaymentsPage() {
    const [payments, setPayments] = useState<PaymentResponse[]>([]);
    const [orders, setOrders] = useState<OrderWalkInsResponse[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Shop filtering
    const { user } = useAuthStore();
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("all");
    const role = (user?.role || "attendant").toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const fetchShops = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const data = await getOrganizationShops();
            setShops(data);
        } catch (error) {
            console.error("Failed to fetch shops:", error);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);



    // Watch payment_method for dynamic fields
    const paymentMethod = Form.useWatch('payment_method', form);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const [ordersData, usersData] = await Promise.all([
                GetWalkinOrdersList(shopIdParams),
                getOrganizationUsers()
            ]);
            setOrders(ordersData);
            setUsers(usersData);

            // If we have orders, and current selectedOrderId is not in the new orders list, select the first one
            if (ordersData.length > 0) {
                if (!selectedOrderId || !ordersData.find(o => o.id === selectedOrderId)) {
                    // We don't auto-select if we are in "View All" mode (which we'll add)
                    if (selectedOrderId !== -1) {
                        setSelectedOrderId(ordersData[0].id);
                    }
                }
            } else {
                setSelectedOrderId(null);
            }
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            toast.error("Failed to load orders or users");
        } finally {
            setLoading(false);
        }
    }, [selectedOrderId, selectedShopId]);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            if (selectedOrderId && selectedOrderId !== -1) {
                const paymentsData = await GetPaymentsByOrderId(selectedOrderId);
                setPayments(paymentsData);
            } else {
                // Fetch all payments for organization or shop
                const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
                const paymentsData = await GetAllPayments(shopIdParams);
                setPayments(paymentsData);
            }
        } catch (error) {
            console.error("Failed to fetch payments:", error);
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    }, [selectedOrderId, selectedShopId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (selectedOrderId) {
            fetchPayments();
        }
    }, [selectedOrderId, fetchPayments]);

    const fetchData = () => {
        fetchInitialData();
        if (selectedOrderId) fetchPayments();
    };

    const showModal = (payment: PaymentResponse | null = null) => {
        setEditingPayment(payment);
        if (payment) {
            form.setFieldsValue({
                ...payment,
                // Status is handled via PaymentUpdateRequest
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                currency: 'GHS',
                exchange_rate: 1.0,
                payment_method: 'Cash',
                payment_number: `PAY-${Date.now().toString().slice(-6)}`
            });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingPayment(null);
        form.resetFields();
    };

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (editingPayment) {
                const updateData: PaymentUpdateRequest = {
                    status: values.status,
                    verified_by: values.verified_by ? Number(values.verified_by) : null,
                    card_last_four: values.card_last_four || null,
                    card_brand: values.card_brand || null,
                    authorization_code: values.authorization_code || null,
                    mobile_provider: values.mobile_provider || null,
                    mobile_number: values.mobile_number || null,
                    transaction_id: values.transaction_id || null,
                    check_number: values.check_number || null,
                    bank_name: values.bank_name || null,
                };

                await UpdatePayment(editingPayment.id, updateData);
                toast.success("Payment updated successfully");
            } else {
                const createData: PaymentRequest = {
                    order_id: Number(values.order_id),
                    payment_number: values.payment_number,
                    payment_method: values.payment_method,
                    amount: Number(values.amount),
                    currency: values.currency || "GHS",
                    exchange_rate: Number(values.exchange_rate || 1.0),
                    card_last_four: values.card_last_four || null,
                    card_brand: values.card_brand || null,
                    authorization_code: values.authorization_code || null,
                    mobile_provider: values.mobile_provider || null,
                    mobile_number: values.mobile_number || null,
                    transaction_id: values.transaction_id || null,
                    check_number: values.check_number || null,
                    bank_name: values.bank_name || null,
                    collected_by: values.collected_by ? Number(values.collected_by) : null,
                };

                await CreatePayment(createData);
                toast.success("Payment recorded successfully");
            }
            handleCancel();
            fetchPayments();
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error(editingPayment ? "Failed to update payment" : "Failed to create payment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await DeletePayment(id);
            toast.success("Payment record deleted");
            fetchPayments();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete payment record");
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'verified':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'failed':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'mobile money': return <Smartphone className="h-4 w-4" />;
            case 'bank transfer':
            case 'check': return <Building2 className="h-4 w-4" />;
            default: return <Banknote className="h-4 w-4" />;
        }
    };

    const filteredPayments = payments.filter((p) => {
        const matchesSearch =
            p.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatus === "all" || p.status?.toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const columns: ColumnsType<PaymentResponse> = [
        {
            title: 'Ref #',
            dataIndex: 'payment_number',
            key: 'payment_number',
            render: (text) => <span className="font-mono text-sm font-semibold text-slate-700">{text}</span>,
        },
        {
            title: 'Order ID',
            dataIndex: 'order_id',
            key: 'order_id',
            render: (id) => (
                <Badge variant="secondary" className="font-mono">
                    #{id}
                </Badge>
            ),
        },
        {
            title: 'Method',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (method) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-md">
                        {getMethodIcon(method)}
                    </div>
                    <span className="text-sm font-medium">{method}</span>
                </div>
            ),
        },
        {
            title: 'Amount',
            key: 'amount',
            align: 'right',
            render: (_, record) => (
                <div className="text-right">
                    <div className="font-bold text-slate-900">
                        {record.currency} {Number(record.amount).toLocaleString()}
                    </div>
                    {record.exchange_rate !== 1 && (
                        <div className="text-[10px] text-slate-400">Rate: {record.exchange_rate}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusStyles(status)}`}
                >
                    {status || 'Pending'}
                </Badge>
            ),
        },
        {
            title: 'Collection',
            key: 'collection',
            render: (_, record) => (
                <div className="text-xs">
                    <div className="text-slate-600 font-medium">By: {users.find(u => u.id === record.collected_by)?.first_name || 'System'}</div>
                    <div className="text-slate-400">{record.payment_date} {record.payment_time}</div>
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                        <DropdownMenuItem onClick={() => showModal(record)} className="py-2 text-sm">
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Popconfirm
                            title="Delete Record"
                            description="Permanently removing this payment record cannot be undone."
                            onConfirm={() => handleDelete(record.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true, size: 'small' }}
                        >
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 py-2 text-sm" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Payment
                            </DropdownMenuItem>
                        </Popconfirm>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader title="Payments" description="Track and manage financial transactions." />

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="lg" onClick={fetchData} disabled={loading} className="shadow-sm border-slate-200">
                        <RefreshCcw className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => showModal()} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 p-3">
                        <Plus className="mr-2 h-5 w-5" /> New Payment
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-full sm:w-[300px]">
                    <Select
                        value={selectedOrderId?.toString()}
                        onValueChange={(val) => setSelectedOrderId(val ? Number(val) : null)}
                    >
                        <SelectTrigger className="w-full h-12 bg-white border-slate-200">
                            <SelectValue placeholder="Select Order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="-1">All Payments (Wide Search)</SelectItem>
                            {orders.map(o => (
                                <SelectItem key={o.id} value={o.id.toString()}>
                                    {`Order #${o.order_number || o.id} (₵${o.total_amount})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <ShoppingBag className="h-5 w-5 text-slate-400" />
                        <Select
                            value={selectedShopId}
                            onValueChange={(value) => setSelectedShopId(value)}
                        >
                            <SelectTrigger className="w-[180px] h-12 bg-white border-slate-200">
                                <SelectValue placeholder="All Shops" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Shops</SelectItem>
                                {shops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id.toString()}>
                                        {shop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search reference or method..."
                        className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                >
                    <SelectTrigger className="h-12 w-full sm:w-[150px] bg-white border-slate-200">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                {(searchTerm !== "" || selectedStatus !== "all" || (orders.length !== 0 && selectedOrderId !== orders[0].id) || selectedShopId !== "all") && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearchTerm("");
                            setSelectedStatus("all");
                            setSelectedShopId("all");
                            if (orders.length > 0) setSelectedOrderId(orders[0].id);
                        }}
                        className="h-12 text-slate-500 hover:text-primary rounded-xl px-4"
                    >
                        <FilterX className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredPayments}
                    rowKey="id"
                    loading={loading}
                    className="ant-table-custom"
                    pagination={{ defaultPageSize: 10, showSizeChanger: true }}
                />
            </div>

            <Modal
                title={
                    <Space size="middle" align="center" className="mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            {editingPayment ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                            <Text strong style={{ fontSize: '18px' }} className="block">
                                {editingPayment ? "Edit Payment Record" : "New Payment Transaction"}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                {editingPayment ? `Ref: ${editingPayment.payment_number}` : "Record a manual or digital payment"}
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
                    <Button key="submit" onClick={() => form.submit()} disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {submitting ? "Saving..." : "Save Record"}
                    </Button>
                ]}
                width={700}
                centered
            >
                <div className="max-h-[70vh] overflow-y-auto pt-2 pb-2 px-1">
                    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
                        <div className="mb-6">
                            <Text strong className="text-sm text-slate-700 flex items-center gap-2 mb-4">
                                <Receipt className="h-4 w-4" />
                                Basic Transaction Data
                            </Text>

                            <Row gutter={12}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="order_id" label={<Text type="secondary">Associated Order</Text>} rules={[{ required: true, message: 'Select an order' }]}>
                                        <Select
                                            value={form.getFieldValue("order_id")?.toString()}
                                            onValueChange={(val) => form.setFieldsValue({ order_id: Number(val) })}
                                        >
                                            <SelectTrigger className="w-full h-10 bg-white border-slate-200">
                                                <SelectValue placeholder="Link to order..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {orders.map(o => (
                                                    <SelectItem key={o.id} value={o.id.toString()}>
                                                        {`Order #${o.order_number || o.id} (₵${o.total_amount})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="payment_number" label={<Text type="secondary">Reference Number</Text>} rules={[{ required: true }]}>
                                        <AntInput placeholder="PAY-XXXXXX" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col xs={24} md={8}>
                                    <Form.Item name="amount" label={<Text type="secondary">Amount Paid</Text>} rules={[{ required: true }]}>
                                        <InputNumber min={0} className="w-full" precision={2} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="currency" label={<Text type="secondary">Currency</Text>}>
                                        <Select
                                            value={form.getFieldValue("currency")}
                                            onValueChange={(val) => form.setFieldsValue({ currency: val })}
                                        >
                                            <SelectTrigger className="w-full h-10 bg-white border-slate-200">
                                                <SelectValue placeholder="Select Currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GHS">GHS (₵)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="payment_method" label={<Text type="secondary">Payment Method</Text>} rules={[{ required: true }]}>
                                        <Select
                                            value={form.getFieldValue("payment_method")}
                                            onValueChange={(val) => form.setFieldsValue({ payment_method: val })}
                                        >
                                            <SelectTrigger className="w-full h-10 bg-white border-slate-200">
                                                <SelectValue placeholder="Select Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                                                <SelectItem value="Card">Card</SelectItem>
                                                <SelectItem value="Check">Check</SelectItem>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* Dynamic Fields */}
                            {(paymentMethod === 'Card') && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Text strong className="text-xs text-slate-500 uppercase flex items-center gap-2 mb-4">
                                        <CreditCard className="h-3 w-3" /> Card Transaction Info
                                    </Text>
                                    <Row gutter={12}>
                                        <Col span={8}>
                                            <Form.Item name="card_brand" label={<Text type="secondary" style={{ fontSize: '12px' }}>Brand (Visa/Master)</Text>}>
                                                <AntInput placeholder="e.g. Visa" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="card_last_four" label={<Text type="secondary" style={{ fontSize: '12px' }}>Last 4 Digits</Text>}>
                                                <AntInput maxLength={4} placeholder="1234" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="authorization_code" label={<Text type="secondary" style={{ fontSize: '12px' }}>Auth Code</Text>}>
                                                <AntInput placeholder="XXXXXX" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {(paymentMethod === 'Mobile Money') && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Text strong className="text-xs text-slate-500 uppercase flex items-center gap-2 mb-4">
                                        <Smartphone className="h-3 w-3" /> Mobile Wallet Details
                                    </Text>
                                    <Row gutter={12}>
                                        <Col span={8}>
                                            <Form.Item name="mobile_provider" label={<Text type="secondary" style={{ fontSize: '12px' }}>Provider (MTN/Airtel)</Text>}>
                                                <AntInput placeholder="e.g. MTN" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="mobile_number" label={<Text type="secondary" style={{ fontSize: '12px' }}>Mobile #</Text>}>
                                                <AntInput placeholder="024XXXXXXX" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="transaction_id" label={<Text type="secondary" style={{ fontSize: '12px' }}>Transaction ID</Text>}>
                                                <AntInput placeholder="TRX-XXXX" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {(paymentMethod === 'Check' || paymentMethod === 'Bank Transfer') && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Text strong className="text-xs text-slate-500 uppercase flex items-center gap-2 mb-4">
                                        <Building2 className="h-3 w-3" /> Bank / Institutional Details
                                    </Text>
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item name="bank_name" label={<Text type="secondary" style={{ fontSize: '12px' }}>Bank Name</Text>}>
                                                <AntInput placeholder="e.g. EcoBank" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="check_number" label={<Text type="secondary" style={{ fontSize: '12px' }}>Ref / Check #</Text>}>
                                                <AntInput placeholder="CHQ-XXXX" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            <div className="mt-6">
                                <Text strong className="text-sm text-slate-700 flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Institutional Tracking
                                </Text>
                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Form.Item name="collected_by" label={<Text type="secondary">Collected By</Text>}>
                                            <Select
                                                value={form.getFieldValue("collected_by")?.toString()}
                                                onValueChange={(val) => form.setFieldsValue({ collected_by: Number(val) })}
                                            >
                                                <SelectTrigger className="w-full h-10 bg-white border-slate-200">
                                                    <SelectValue placeholder="Select staff..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map(u => (
                                                        <SelectItem key={u.id} value={u.id.toString()}>
                                                            {`${u.first_name} ${u.last_name}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    {editingPayment && (
                                        <Col span={12}>
                                            <Form.Item name="status" label={<Text type="secondary">Payment Status</Text>}>
                                                <Select
                                                    value={form.getFieldValue("status")}
                                                    onValueChange={(val) => form.setFieldsValue({ status: val })}
                                                >
                                                    <SelectTrigger className="w-full h-10 bg-white border-slate-200">
                                                        <SelectValue placeholder="Select Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="verified">Verified</SelectItem>
                                                        <SelectItem value="failed">Failed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>
                                {editingPayment && (
                                    <Row gutter={12}>
                                        <Col span={24}>
                                            <Form.Item name="verified_by" label={<Text type="secondary">Verified By</Text>}>
                                                <Select
                                                    value={form.getFieldValue("verified_by")?.toString()}
                                                    onValueChange={(val) => form.setFieldsValue({ verified_by: val ? Number(val) : null })}
                                                >
                                                    <SelectTrigger className="w-full h-10 bg-white border-slate-200">
                                                        <SelectValue placeholder="Select verifier..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {users.map(u => (
                                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                                {`${u.first_name} ${u.last_name}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                            </div>
                        </div>
                    </Form>
                </div>
            </Modal>
        </div >
    );
}
