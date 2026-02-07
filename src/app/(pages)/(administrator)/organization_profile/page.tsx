"use client"

import { useEffect, useState, useCallback } from 'react';
import { Form, Input, Card, Row, Col, Button, message, Divider } from 'antd';
import { Building2, Mail, Phone, MapPin, Save, Info } from 'lucide-react';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { getOrganizationProfileByOrgId, updateOrganizationProfile } from '@/(api-handlers)/organizationProfileHandler';
import { OrganizationResponse } from '@/interfaces/organization';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import axios from 'axios';

const { TextArea } = Input;

export default function OrganizationProfile() {
    const { user } = useAuthStore();
    const [form] = Form.useForm<OrganizationResponse>();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [originalData, setOriginalData] = useState<OrganizationResponse | null>(null);
    const [isChanged, setIsChanged] = useState(false);

    const organizationId = user?.organization?.id || user?.employee_profile?.organization_id;

    const fetchProfile = useCallback(async () => {
        if (!organizationId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await getOrganizationProfileByOrgId(organizationId);
            const profileData = Array.isArray(data) ? data[0] : data;

            if (profileData) {
                setOriginalData(profileData);
                form.setFieldsValue(profileData);
            }
        } catch (error: unknown) {
            let errorMessage = 'Failed to fetch organization profile';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            message.error(errorMessage);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [organizationId, form]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onValuesChange = (_: unknown, allValues: Partial<OrganizationResponse>) => {
        if (!originalData) return;

        const hasChanged =
            allValues.name !== originalData.name ||
            (allValues.description || "") !== (originalData.description || "") ||
            allValues.address !== originalData.address ||
            allValues.email !== originalData.email ||
            allValues.phone_number !== originalData.phone_number;

        setIsChanged(hasChanged || false);
    };

    const handleUpdate = async (values: OrganizationResponse) => {
        if (!organizationId) return;
        setUpdating(true);
        try {
            await updateOrganizationProfile(organizationId, values);
            message.success('Organization profile updated successfully');
            setIsChanged(false);
            fetchProfile();
        } catch (error: unknown) {
            let errorMessage = 'Failed to update profile';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            message.error(errorMessage);
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loading text="Loading organization profile..." />
            </div>
        );
    }

    if (!organizationId) {
        return (
            <div className="p-4">
                <PageHeader title='Organization Profile' />
                <Card className="text-center py-10 mt-6 border-gray-200">
                    <Info className="size-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Organization identification not found. Please log in again.</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <PageHeader
                title='Organization Profile'
                description='Manage and update your organization details.'
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
                onValuesChange={onValuesChange}
                className="mt-8"
            >
                <Card
                    title={<div className="flex items-center gap-2"><Building2 className="size-5 text-primary" /> General Information</div>}
                    className="shadow-sm border-gray-200"
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label="Organization Name"
                                rules={[{ required: true, message: 'Please enter organization name' }]}
                            >
                                <Input placeholder="Acme Corp" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="email"
                                label="Contact Email"
                                rules={[
                                    { required: true, message: 'Please enter contact email' },
                                    { type: 'email', message: 'Invalid email format' }
                                ]}
                            >
                                <Input placeholder="contact@acme.com" prefix={<Mail className="size-4 text-gray-400 mr-2" />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="phone_number"
                                label="Phone Number"
                                rules={[{ required: true, message: 'Please enter phone number' }]}
                            >
                                <Input placeholder="+233..." prefix={<Phone className="size-4 text-gray-400 mr-2" />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="address"
                                label="Physical Address"
                                rules={[{ required: true, message: 'Please enter address' }]}
                            >
                                <Input placeholder="123 Street, City" prefix={<MapPin className="size-4 text-gray-400 mr-2" />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="description"
                                label="Description"
                            >
                                <TextArea rows={4} placeholder="A short description of your organization..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card
                    title={<div className="flex items-center gap-2 mt-4"><Info className="size-5 text-gray-400" /> Subscription & Limits</div>}
                    className="shadow-sm border-gray-200 mt-6 bg-gray-50/50"
                >
                    <p className="text-sm text-gray-500 mb-6 font-medium">Subscription details are managed by the platform administrator and cannot be modified here.</p>
                    <Row gutter={24}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item label="Currency" name="currency">
                                <Input disabled className="bg-gray-100! text-gray-600 font-medium" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item label="Plan Type" name="plan_type">
                                <Input disabled className="bg-gray-100! text-gray-600 font-medium capitalize" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item label="Max Shops" name="max_shops">
                                <Input disabled className="bg-gray-100! text-gray-600 font-medium" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item label="Max Users" name="max_users">
                                <Input disabled className="bg-gray-100! text-gray-600 font-medium" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider className="my-4" />
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Created On" labelCol={{ span: 24 }}>
                                <Input value={originalData?.created_at ? new Date(originalData.created_at).toLocaleString() : ''} disabled className="bg-gray-100! text-gray-600" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Last Updated" labelCol={{ span: 24 }}>
                                <Input value={originalData?.updated_at ? new Date(originalData.updated_at).toLocaleString() : ''} disabled className="bg-gray-100! text-gray-600" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <div className="mt-8 flex justify-end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={!isChanged || updating}
                        loading={updating}
                        icon={!updating && <Save className="size-4" />}
                        className="bg-primary hover:bg-primary/90 min-w-[170px] h-11 flex items-center justify-center gap-2 rounded-md font-medium"
                    >
                        {updating ? 'Updating...' : 'Update Profile'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}