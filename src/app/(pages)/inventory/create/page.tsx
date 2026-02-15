/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Card, Select, Switch, Space, Divider, message, Breadcrumb } from 'antd';
import {
    Save, X, Package, Ruler, Navigation,
    ArrowLeft, AlertCircle, TrendingUp, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { CreateInventory } from '@/(api-handlers)/inventoryHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { CreateInventoryRequest } from '@/interfaces/inventory';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

const { Option } = Select;

export default function CreateInventoryPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const data = await getOrganizationShops();
                setShops(data);
            } catch (error) {
                console.error("Failed to fetch shops", error);
            }
        };
        fetchShops();
    }, []);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload: CreateInventoryRequest = {
                ...values,
                is_active: values.is_active ?? true,
                on_sale: values.on_sale ?? false,
            };
            await CreateInventory(payload);
            message.success('Inventory record created successfully');
            router.push('/inventory');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to create inventory record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Breadcrumb className="mb-4 text-xs">
                    <Breadcrumb.Item><Link href="/inventory">Inventory</Link></Breadcrumb.Item>
                    <Breadcrumb.Item>Create New Record</Breadcrumb.Item>
                </Breadcrumb>

                <div className="flex items-center gap-4 mb-8">
                    <Button
                        icon={<ArrowLeft className="size-4" />}
                        onClick={() => router.back()}
                        className="rounded-xl border-slate-200"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Inventory Record</h1>
                        <p className="text-slate-500 text-sm">Initialize a new stock tracking entry for a product.</p>
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        current_stock: 0,
                        minimum_stock: 5,
                        maximum_stock: 100,
                        reorder_point: 10,
                        reorder_quantity: 20,
                        unit_of_measurement: 'units',
                        is_active: true,
                        on_sale: false
                    }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Primary Info */}
                        <Card className="md:col-span-2 rounded-2xl border-slate-100 shadow-sm" title={<span className="flex items-center gap-2"><Package className="size-4 text-primary" /> Product Association</span>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Form.Item
                                    name="product_id"
                                    label="Product ID"
                                    rules={[{ required: true, message: 'Please input product ID' }]}
                                >
                                    <InputNumber className="w-full" placeholder="Enter Product ID" />
                                </Form.Item>

                                <Form.Item
                                    name="shop_id"
                                    label="Assigned Shop"
                                    rules={[{ required: true, message: 'Please select a shop' }]}
                                >
                                    <Select placeholder="Select Shop">
                                        {shops.map(shop => (
                                            <Option key={shop.id} value={shop.id}>{shop.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="unit_of_measurement"
                                    label="Unit of Measurement"
                                    rules={[{ required: true, message: 'Example: units, kg, liters' }]}
                                >
                                    <Select placeholder="Select or type unit" showSearch>
                                        <Option value="units">Units / Pieces</Option>
                                        <Option value="kg">Kilograms (kg)</Option>
                                        <Option value="liters">Liters (L)</Option>
                                        <Option value="packs">Packs</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item name="on_sale" label="Available for Sale" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </div>
                        </Card>

                        {/* Status Sidebar */}
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-slate-100 shadow-sm bg-slate-50/50">
                                <Form.Item name="is_active" label="Status" valuePropName="checked">
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-sm font-medium text-slate-600">Active Tracking</span>
                                        <Switch />
                                    </div>
                                </Form.Item>
                                <Divider className="my-4 border-slate-200" />
                                <div className="flex items-start gap-2 text-xs text-slate-500">
                                    <Info className="size-4 shrink-0 text-blue-500" />
                                    <p>Inactive records will be hidden from the main inventory dashboard but preserved for logs.</p>
                                </div>
                            </Card>
                        </div>

                        {/* Inventory Levels */}
                        <Card className="md:col-span-3 rounded-2xl border-slate-100 shadow-sm" title={<span className="flex items-center gap-2"><TrendingUp className="size-4 text-emerald-500" /> Stock Configuration</span>}>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <Form.Item
                                    name="current_stock"
                                    label="Opening Stock"
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber className="w-full" min={0} />
                                </Form.Item>

                                <Form.Item
                                    name="minimum_stock"
                                    label="Min. Stock"
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber className="w-full" min={0} />
                                </Form.Item>

                                <Form.Item
                                    name="maximum_stock"
                                    label="Max. Stock"
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber className="w-full" min={0} />
                                </Form.Item>

                                <Form.Item
                                    name="reorder_point"
                                    label="Reorder Point"
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber className="w-full" min={0} />
                                </Form.Item>

                                <Form.Item
                                    name="reorder_quantity"
                                    label="Reorder Qty"
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber className="w-full" min={0} />
                                </Form.Item>
                            </div>

                            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                <AlertCircle className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-emerald-800">
                                    <p className="font-semibold">Smart Tracking Enabled</p>
                                    <p className="opacity-80">System will automatically mark items for reorder when stock falls below {form.getFieldValue('reorder_point') || 10} units.</p>
                                </div>
                            </div>
                        </Card>

                        {/* Location Details */}
                        <Card className="md:col-span-3 rounded-2xl border-slate-100 shadow-sm" title={<span className="flex items-center gap-2"><Navigation className="size-4 text-amber-500" /> Storage Location</span>}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Form.Item name="aisle" label="Aisle">
                                    <Input placeholder="e.g. Aisle 4" />
                                </Form.Item>

                                <Form.Item name="shelf" label="Shelf">
                                    <Input placeholder="e.g. Shelf B2" />
                                </Form.Item>

                                <Form.Item name="bin_location" label="Bin Location">
                                    <Input placeholder="e.g. BIN-092" />
                                </Form.Item>
                            </div>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            icon={<X className="size-4" />}
                            onClick={() => router.back()}
                            className="h-11 px-6 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<Save className="size-4" />}
                            className="bg-primary h-11 px-8 rounded-xl shadow-lg shadow-blue-100"
                        >
                            Create Inventory Record
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
