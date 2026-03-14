/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Card, message } from 'antd';
import { Plus, Store, MapPin, Phone } from 'lucide-react';
import { OrganizationShopRequest, OrganizationShopResponse } from '@/interfaces/organizationShops';
import { createOrganizationShop, getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';

export default function OrganizationShops() {
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
    const [form] = Form.useForm();

    const fetchShops = async () => {
        setLoading(true);
        try {
            const data = await getOrganizationShops();
            setShops(data);
        } catch (error: any) {
            message.error('Failed to fetch shops');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleCreateShop = async (values: OrganizationShopRequest) => {
        setConfirmLoading(true);
        try {
            await createOrganizationShop(values);
            message.success('Shop created successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchShops();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create shop');
            console.error(error);
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <div className="p-4">
            <PageHeader
                title='Organization Shops'
                description='Manage your organization branches and locations.'
            >
                <Button
                    type="primary"
                    icon={<Plus className="size-4" />}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary! hover:bg-primary/90! flex items-center gap-2"
                >
                    Add New Shop
                </Button>
            </PageHeader>

            <Card className="mt-6 border-gray-200 shadow-sm">
                <div className="flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            Shop Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Location
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Created At
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Updated At
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="py-10">
                                                <Loading text="Fetching shops..." />
                                            </td>
                                        </tr>
                                    ) : shops.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-10">
                                                <EmptyState
                                                    title="No shops found"
                                                    description="You haven't added any shops yet. Click the button above to create one."
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        shops.map((shop) => (
                                            <tr key={shop.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    <div className="flex items-center gap-2">
                                                        <Store className="size-4 text-gray-400" />
                                                        {shop.name}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="size-4 text-gray-400" />
                                                        {shop.location}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="size-4 text-gray-400" />
                                                        {shop.phone}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(shop.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(shop.updated_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Card>

            <Modal
                title="Add New Shop"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                className="top-20"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateShop}
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Shop Name"
                        rules={[{ required: true, message: 'Please enter shop name' }]}
                    >
                        <Input placeholder="Main Branch" prefix={<Store className="size-4 text-gray-400 mr-2" />} />
                    </Form.Item>

                    <Form.Item
                        name="location"
                        label="Location"
                        rules={[{ required: true, message: 'Please enter shop location' }]}
                    >
                        <Input placeholder="123 Street, City" prefix={<MapPin className="size-4 text-gray-400 mr-2" />} />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                    >
                        <Input placeholder="+233..." prefix={<Phone className="size-4 text-gray-400 mr-2" />} />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={confirmLoading}
                            className="bg-primary! hover:bg-primary/90!"
                        >
                            Create Shop
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}