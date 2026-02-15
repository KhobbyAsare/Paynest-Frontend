/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from 'react';
import {
    Form, Input, Button, Card, Row, Col,
    Select, DatePicker, Switch, Typography,
    Breadcrumb, InputNumber
} from 'antd';
import {
    User, Mail, Phone, MapPin,
    Save, X, ArrowLeft, Star,
    CreditCard, MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateCustomer } from '@/(api-handlers)/customersHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function CreateCustomerPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Format date for API
            const formattedData = {
                ...values,
                date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
                communication_preferences: {
                    additionalProp1: "email" // Default or as per requirements
                }
            };

            await CreateCustomer(formattedData);
            toast.success('Customer profile created successfully');
            router.push('/customers');
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <Breadcrumb className="mb-4! text-xs font-medium">
                    <Breadcrumb.Item><Link href="/customers" className="text-slate-400 hover:text-primary">Customers</Link></Breadcrumb.Item>
                    <Breadcrumb.Item className="text-slate-900 font-bold">Add New Customer</Breadcrumb.Item>
                </Breadcrumb>

                <div className="flex items-center gap-4 mb-8">
                    <Button
                        icon={<ArrowLeft className="size-4" />}
                        onClick={() => router.back()}
                        className="rounded-xl border-slate-200 h-11 w-11 flex items-center justify-center shadow-sm"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 m-0">Create Profile</h1>
                        <p className="text-slate-500 text-sm">Onboard a new customer to the platform database.</p>
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        loyalty_points: 0,
                        loyalty_tier: 'Standard',
                        is_active: true,
                        preferred_payment_method: 'Cash',
                        gender: 'Other'
                    }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left column - Basic Info */}
                        <div className="lg:col-span-2 space-y-6!">
                            <Card title={<span className="flex items-center gap-2"><User className="size-4" /> Personal Information</span>} className="rounded-2xl shadow-sm border-slate-100">
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: 'Please enter first name' }]}>
                                            <Input placeholder="John" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="last_name" label="Last Name" rules={[{ required: true, message: 'Please enter last name' }]}>
                                            <Input placeholder="Doe" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="email" label="Email Address" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
                                            <Input prefix={<Mail className="size-4 text-slate-400" />} placeholder="john@example.com" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Phone number is required' }]}>
                                            <Input prefix={<Phone className="size-4 text-slate-400" />} placeholder="+1 234 567 890" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="date_of_birth" label="Date of Birth">
                                            <DatePicker className="w-full h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="gender" label="Gender">
                                            <Select className="h-11 profile-select" popupClassName="rounded-xl">
                                                <Option value="Male">Male</Option>
                                                <Option value="Female">Female</Option>
                                                <Option value="Other">Other</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title={<span className="flex items-center gap-2"><MapPin className="size-4" /> Address Details</span>} className="rounded-2xl shadow-sm border-slate-100">
                                <Form.Item name="address" label="Street Address">
                                    <Input placeholder="123 Business Way" className="h-11 rounded-xl" />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="city" label="City">
                                            <Input placeholder="New York" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="state" label="State/Region">
                                            <Input placeholder="NY" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="country" label="Country">
                                            <Input placeholder="United States" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="postal_code" label="Postal Code">
                                            <Input placeholder="10001" className="h-11 rounded-xl" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title={<span className="flex items-center gap-2"><MessageSquare className="size-4" /> Additional Notes</span>} className="rounded-2xl shadow-sm border-slate-100">
                                <Form.Item name="notes">
                                    <TextArea placeholder="Internal remarks about customer preferences or history..." rows={4} className="rounded-xl" />
                                </Form.Item>
                            </Card>
                        </div>

                        {/* Right column - Status & Settings */}
                        <div className="space-y-6!">
                            <Card className="rounded-2xl shadow-sm border-slate-100 bg-slate-900 text-white overflow-hidden relative">
                                <div className="absolute -top-6 -right-6 size-24 bg-blue-500/10 rounded-full" />
                                <Title level={5} className="text-white! mb-6">Profile Configuration</Title>
                                <Form.Item name="customer_code" label={<span className="text-slate-400">Unique Code</span>} rules={[{ required: true }]}>
                                    <Input placeholder="CUST-0001" className="bg-white/5 border-white/20 text-white hover:border-blue-400 focus:bg-white/10 h-11 rounded-xl" />
                                </Form.Item>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm font-medium">Account Status</span>
                                        <Form.Item name="is_active" valuePropName="checked" noStyle>
                                            <Switch className="bg-slate-700" />
                                        </Form.Item>
                                    </div>
                                    <Text className="text-white/40 text-[10px] block font-bold uppercase tracking-wider">Active profiles can earn loyalty points.</Text>
                                </div>
                            </Card>

                            <Card title={<span className="flex items-center gap-2"><Star className="size-4 text-amber-500" /> Loyalty Program</span>} className="rounded-2xl shadow-sm border-slate-100">
                                <Form.Item name="loyalty_tier" label="Membership Tier">
                                    <Select className="h-11 rounded-xl">
                                        <Option value="Standard">Standard</Option>
                                        <Option value="Silver">Silver</Option>
                                        <Option value="Gold">Gold</Option>
                                        <Option value="Platinum">Platinum</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="loyalty_points" label="Initial Points">
                                    <InputNumber min={0} className="w-full h-11 px-0 flex items-center rounded-xl" />
                                </Form.Item>
                            </Card>

                            <Card title={<span className="flex items-center gap-2"><CreditCard className="size-4" /> Finance</span>} className="rounded-2xl shadow-sm border-slate-100">
                                <Form.Item name="preferred_payment_method" label="Payment Method">
                                    <Select className="h-11 rounded-xl">
                                        <Option value="Cash">Cash</Option>
                                        <Option value="Card">Credit/Debit Card</Option>
                                        <Option value="Transfer">Bank Transfer</Option>
                                        <Option value="Mobile">Mobile Money</Option>
                                    </Select>
                                </Form.Item>
                            </Card>

                            <div className="flex flex-col gap-3 mt-8">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<Save className="size-4" />}
                                    className="bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold shadow-lg shadow-blue-100 w-full"
                                >
                                    Save Customer Profile
                                </Button>
                                <Button
                                    icon={<X className="size-4" />}
                                    onClick={() => router.back()}
                                    className="h-12 rounded-xl font-bold w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}
