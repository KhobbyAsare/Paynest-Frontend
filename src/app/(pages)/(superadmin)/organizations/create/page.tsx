'use client'

import { useState } from 'react'
import { Form, Input, Card, Row, Col, Select, InputNumber, message, Space, Divider } from 'antd'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, UserCog, Send, Loader2 } from 'lucide-react'
import PageHeader from '@/components/(shared-components)/PageHeader'
import { onboardOrganizationAndAdmin } from '@/(api-handlers)/organizationHandler'
import { OnboardingOrganizationAndAdminRequest } from '@/interfaces/organization'
import Link from 'next/link'

const { Option } = Select
const { TextArea } = Input

export default function CreateOrganization() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const [form] = Form.useForm()

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            const requestData: OnboardingOrganizationAndAdminRequest = {
                ...values,
                is_active: true, // Default to active
            }
            await onboardOrganizationAndAdmin(requestData)
            message.success('Organization and Admin onboarded successfully')
            router.push('/organizations')
        } catch (error: any) {
            console.error(error)
            message.error(error.response?.data?.message || 'Failed to onboard organization')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto pt-2">
            <div className="mb-3 ">
                <Link href='/organizations'>
                    <button
                        className="flex items-center gap-2 p-0 h-auto text-primary-color! hover:text-primary"
                    >
                        <ArrowLeft className='size-4' />
                        Back to Organizations
                    </button>
                </Link>
            </div>

            <PageHeader
                title="Onboard New Organization"
                description="Set up a new organization and its primary administrator account."
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    currency: 'GHS',
                    plan_type: 'starter',
                    max_shops: 1,
                    max_users: 2
                }}
                className="mt-8"
            >
                {/* Organization Details Section */}
                <Card
                    title={<div className="flex items-center gap-2"><Building2 className="size-5 text-primary" /> Organization Information</div>}
                    className="shadow-sm border-gray-200"
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label="Organization Name"
                                rules={[{ required: true, message: 'Please enter organization name' }]}
                            >
                                <Input placeholder="e.g. Acme Corp" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="email"
                                label="Organization Email"
                                rules={[
                                    { required: true, message: 'Please enter organization email' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="contact@acme.com" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="phone_number"
                                label="Phone Number"
                                rules={[{ required: true, message: 'Please enter phone number' }]}
                            >
                                <Input placeholder="+233..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="currency"
                                label="Currency"
                                rules={[{ required: true, message: 'Please select currency' }]}
                            >
                                <Select placeholder="Select Currency">
                                    <Option value="GHS">Ghana Cedi (GHS)</Option>
                                    <Option value="USD">US Dollar (USD)</Option>
                                    <Option value="GBP">British Pound (GBP)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="address"
                                label="Physical Address"
                                rules={[{ required: true, message: 'Please enter address' }]}
                            >
                                <Input placeholder="Plot 45, Street Name, City" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="description"
                                label="Description"
                            >
                                <TextArea rows={3} placeholder="A brief description of the organization..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider className="text-gray-400 text-xs font-normal uppercase tracking-wider">Subscription Limits</Divider>

                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="plan_type"
                                label="Plan Type"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value="starter">Starter</Option>
                                    <Option value="professional">Professional</Option>
                                    <Option value="enterprise">Enterprise</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={12} md={8}>
                            <Form.Item
                                name="max_shops"
                                label="Max Shops"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} className="w-full" />
                            </Form.Item>
                        </Col>
                        <Col xs={12} md={8}>
                            <Form.Item
                                name="max_users"
                                label="Max Users"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* Admin Account Section */}
                <Card
                    title={<div className="flex items-center gap-2 mt-2"><UserCog className="size-5 text-primary" /> Admin Account Information</div>}
                    className="shadow-sm border-gray-200 "
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="admin_first_name"
                                label="First Name"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="John" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="admin_last_name"
                                label="Last Name"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="Doe" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="admin_username"
                                label="Username"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="jdoe_admin" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="admin_email"
                                label="Admin Email"
                                rules={[
                                    { required: true, message: 'Required' },
                                    { type: 'email', message: 'Invalid email' }
                                ]}
                            >
                                <Input placeholder="j.doe@example.com" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="admin_phone_number"
                                label="Admin Phone"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="+233..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="admin_password"
                                label="Initial Password"
                                rules={[
                                    { required: true, message: 'Required' },
                                    { min: 8, message: 'Min 8 characters' }
                                ]}
                            >
                                <Input.Password placeholder="••••••••" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <div className="mt-8 flex justify-end gap-x-4">
                    <button className='border border-primary px-4 py-2 rounded-md hover:bg-primary/50' onClick={() => router.push('/organizations')}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
                    >
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        Onboard Organization
                    </button>
                </div>
            </Form>
        </div>
    )
}
