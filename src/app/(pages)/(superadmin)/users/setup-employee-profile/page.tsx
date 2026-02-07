"use client"

import { useEffect, useState, useMemo } from 'react';
import { Form, Input, Card, Row, Col, Select, Button, DatePicker, Checkbox, Divider, Space, Typography, message, Avatar, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { UserOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { getOrganizationUsers } from '@/(api-handlers)/userHandler';
import { createEmployeeProfile } from '@/(api-handlers)/employeeProfileHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import { EmployeeProfileRequest } from '@/interfaces/employeeProfile';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import Loading from '@/components/(shared-components)/Loading';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SetUpEmployeeProfile() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const [form] = Form.useForm();

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getOrganizationUsers();
            setUsers(data);
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const usersWithoutProfile = useMemo(() => {
        return users.filter(u => !u.employee_profile);
    }, [users]);

    const selectedUserInfo = useMemo(() => {
        return users.find(u => u.id === selectedUserId);
    }, [selectedUserId, users]);

    const onFinish = async (values: any) => {
        if (!selectedUserId || !currentUser?.organization?.id) {
            message.error("Missing user or organization information");
            return;
        }

        setSubmitting(true);
        try {
            const requestData: EmployeeProfileRequest = {
                ...values,
                user_id: selectedUserId,
                organization_id: currentUser.organization.id,
                shop_id: values.shop_id || 1, // Defaulting to 1 as per current research
                hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : null,
                termination_date: values.termination_date ? values.termination_date.format('YYYY-MM-DD') : null,
                can_create_shop: !!values.can_create_shop,
                can_manage_users: !!values.can_manage_users,
                can_view_reports: !!values.can_view_reports,
                can_manage_inventory: !!values.can_manage_inventory,
            };

            await createEmployeeProfile(requestData);
            message.success('Employee profile set up successfully!');
            router.push('/users'); // Redirect to users list
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to set up employee profile');
        } finally {
            setSubmitting(false); // Changed from true to false
        }
    };

    if (loading) return <Loading text="Loading user data..." />;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="mt-4">
                <button
                    onClick={() => router.back()}
                    className="p-0 text-gray-500 hover:text-primary! flex items-center gap-2 cursor-pointer"
                >
                    <ArrowLeftOutlined />
                    Back
                </button>
            </div>

            <PageHeader
                title='Setup Employee Profile'
                description='Create a professional profile for an existing organization user.'
            />

            <Card className="shadow-sm border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                        <Title level={5}>Select User</Title>
                        <Text type="secondary" className="block mb-3">Choose a user from your organization who does not yet have an employee profile.</Text>
                        <Select
                            showSearch
                            placeholder="Search and select a user..."
                            optionFilterProp="children"
                            className="w-full h-10"
                            onChange={(id) => setSelectedUserId(id)}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={usersWithoutProfile.map(u => ({
                                value: u.id,
                                label: `${u.first_name} ${u.last_name} (${u.username})`,
                            }))}
                        />
                    </div>
                    {selectedUserInfo && (
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 min-w-[300px]">
                            <Avatar size={54} src={selectedUserInfo.profile_pic} icon={<UserOutlined />} />
                            <div>
                                <Text strong className="block">{selectedUserInfo.first_name} {selectedUserInfo.last_name}</Text>
                                <Text type="secondary" className="text-xs">{selectedUserInfo.email}</Text>
                                <Tag color="blue" className="mt-1 block w-fit">{selectedUserInfo.role}</Tag>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {selectedUserId && (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        employment_type: 'full-time',
                        employment_status: 'active',
                        role: selectedUserInfo?.role || 'attendant',
                        shop_id: 1,
                    }}
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card title="Employment Details" className="shadow-sm border-gray-200 mb-6">
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="employee_code"
                                            label="Employee Code"
                                            rules={[{ required: true, message: 'Required' }]}
                                        >
                                            <Input placeholder="e.g. EMP-001" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="department" label="Department">
                                            <Input placeholder="e.g. Sales, Inventory" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="job_title"
                                            label="Job Title"
                                            rules={[{ required: true, message: 'Required' }]}
                                        >
                                            <Input placeholder="e.g. Store Manager" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="hire_date" label="Hire Date">
                                            <DatePicker className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="employment_type" label="Employment Type">
                                            <Select>
                                                <Option value="full_time">Full-time</Option>
                                                <Option value="part_time">Part-time</Option>
                                                <Option value="contract">Contract</Option>
                                                <Option value="freelance">Freelance</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="employment_status" label="Employment Status">
                                            <Select>
                                                <Option value="active">Active</Option>
                                                <Option value="probation">Probation</Option>
                                                <Option value="on-leave">On Leave</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title="Work Contact Information" className="shadow-sm border-gray-200 mb-6">
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="work_email" label="Work Email">
                                            <Input placeholder="work@organization.com" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="work_phone" label="Work Phone">
                                            <Input placeholder="Official contact number" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title="Permissions & Role" className="shadow-sm border-gray-200 mb-6">
                                <Form.Item
                                    name="role"
                                    label="System Role"
                                    rules={[{ required: true, message: 'Required' }]}
                                    extra="This overrides the user's current system role."
                                >
                                    <Select>
                                        <Option value="admin">Admin</Option>
                                        <Option value="manager">Manager</Option>
                                        <Option value="attendant">Attendant</Option>
                                    </Select>
                                </Form.Item>

                                <Divider className="my-4" />
                                <Title level={5} className="mb-4">Specific Access</Title>

                                <Space direction="vertical" className="w-full">
                                    <Form.Item name="can_create_shop" valuePropName="checked" noStyle>
                                        <Checkbox>Can Create Shop</Checkbox>
                                    </Form.Item>
                                    <Form.Item name="can_manage_users" valuePropName="checked" noStyle>
                                        <Checkbox>Can Manage Users</Checkbox>
                                    </Form.Item>
                                    <Form.Item name="can_view_reports" valuePropName="checked" noStyle>
                                        <Checkbox>Can View Reports</Checkbox>
                                    </Form.Item>
                                    <Form.Item name="can_manage_inventory" valuePropName="checked" noStyle>
                                        <Checkbox>Can Manage Inventory</Checkbox>
                                    </Form.Item>
                                </Space>
                            </Card>

                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <Text type="secondary" className="text-sm">
                                    Setting up an employee profile will allow you to track performance, manage assignments, and control access levels for this user.
                                </Text>
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    className="mt-4"
                                    htmlType="submit"
                                    loading={submitting}
                                    icon={<SaveOutlined />}
                                >
                                    Create Profile
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Form>
            )}
        </div>
    );
}