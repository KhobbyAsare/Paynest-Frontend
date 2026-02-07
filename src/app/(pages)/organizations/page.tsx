'use client'
import PageHeader from "@/components/(shared-components)/PageHeader";
import { useState, useEffect } from "react";
import { OrganizationResponse } from "@/interfaces/organization";
import { Button, Input, message, Tag, Dropdown, Modal, Select } from "antd";
import { SearchOutlined, PlusOutlined, MoreOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { getAllOrganizations, changeOrganizationPlanType, deleteOrganization } from "@/(api-handlers)/organizationHandler";
import { useRouter } from "next/navigation";
import Loading from "@/components/(shared-components)/Loading";
import EmptyState from "@/components/(shared-components)/EmptyState";

export default function SuperAdminDashboardView() {
    const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [filteredOrganizations, setFilteredOrganizations] = useState<OrganizationResponse[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const [selectedOrg, setSelectedOrg] = useState<OrganizationResponse | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isChangePlanModalVisible, setIsChangePlanModalVisible] = useState(false);
    const [newPlan, setNewPlan] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const data = await getAllOrganizations();
            setOrganizations(data);
            setFilteredOrganizations(data);
        } catch (error: any) {
            message.error('Failed to fetch organizations');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        const filtered = organizations.filter(org =>
            org.name.toLowerCase().includes(searchText.toLowerCase()) ||
            org.email.toLowerCase().includes(searchText.toLowerCase()) ||
            org.phone_number.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredOrganizations(filtered);
        setCurrentPage(1); // Reset to first page on search
    }, [searchText, organizations]);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrganizations = filteredOrganizations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleDelete = async () => {
        if (!selectedOrg) return;
        setActionLoading(true);
        try {
            await deleteOrganization(selectedOrg.id);
            message.success('Organization deleted successfully');
            fetchOrganizations();
            setIsDeleteModalVisible(false);
        } catch (error) {
            message.error('Failed to delete organization');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePlan = async () => {
        if (!selectedOrg || !newPlan) return;
        setActionLoading(true);
        try {
            await changeOrganizationPlanType(selectedOrg.id, newPlan);
            message.success(`Plan changed to ${newPlan} successfully`);
            fetchOrganizations();
            setIsChangePlanModalVisible(false);
        } catch (error) {
            message.error('Failed to change plan');
        } finally {
            setActionLoading(false);
        }
    };


    return (
        <div>
            <PageHeader title="Organizations" description="Manage and monitor all platform organizations in one place." />

            <div className="flex justify-between items-center mb-6 ">
                <div className="md:w-[500px]! w-full!">
                    <Input
                        placeholder="Search organizations..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full"
                    />
                </div>

                <button className="bg-primary text-white rounded-md flex items-center gap-2 text-sm w-fit p-2" onClick={() => router.push('/organizations/create')}>
                    <PlusOutlined /> Add Organization
                </button>
            </div>

            <div className="mt-8 bg-white p-4 rounded-md border flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="relative min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                        Organization Name
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Description
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Address
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Email
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Plan
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Shops/Users
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Created At
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-left text-sm font-semibold text-gray-900 sm:pr-0">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="py-10">
                                            <Loading text="Fetching organizations..." />
                                        </td>
                                    </tr>
                                ) : filteredOrganizations.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-10">
                                            <EmptyState
                                                title={searchText ? "No organizations match your search" : "No organizations found"}
                                                description={searchText ? `No results for "${searchText}". Try a different keyword.` : "There are currently no organizations in the system."}
                                                onAction={() => router.push('/organizations/create')}
                                                actionText="Add Organization"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    currentOrganizations.map((org) => (
                                        <tr key={org.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                {org.name}
                                            </td>
                                            <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{org.description}</td>
                                            <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{org.address}</td>
                                            <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{org.email}</td>
                                            <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">
                                                <Tag color="blue" className="capitalize">{org.plan_type}</Tag>
                                            </td>
                                            <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">
                                                S: {org.max_shops} / U: {org.max_users}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <Tag color={org.is_active ? 'green' : 'red'}>
                                                    {org.is_active ? 'Active' : 'Inactive'}
                                                </Tag>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {new Date(org.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                <Dropdown
                                                    menu={{
                                                        items: [
                                                            { key: 'changePlan', label: 'Change Plan', icon: <EditOutlined /> },
                                                            { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true },
                                                        ],
                                                        onClick: ({ key }) => {
                                                            setSelectedOrg(org);
                                                            if (key === 'changePlan') {
                                                                setNewPlan(org.plan_type);
                                                                setIsChangePlanModalVisible(true);
                                                            } else if (key === 'delete') {
                                                                setIsDeleteModalVisible(true);
                                                            }
                                                        }
                                                    }}
                                                    trigger={['click']}
                                                >
                                                    <Button type="text" icon={<MoreOutlined rotate={90} />} />
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {filteredOrganizations.length > itemsPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(indexOfLastItem, filteredOrganizations.length)}</span> of{' '}
                                    <span className="font-medium">{filteredOrganizations.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Plan Modal */}
            <Modal
                title="Change Organization Plan"
                open={isChangePlanModalVisible}
                onOk={handleChangePlan}
                onCancel={() => setIsChangePlanModalVisible(false)}
                confirmLoading={actionLoading}
            >
                <div className="py-4">
                    <p className="mb-2 text-sm text-gray-600">Select new plan for <strong>{selectedOrg?.name}</strong>:</p>
                    <Select
                        className="w-full"
                        value={newPlan}
                        onChange={(value) => setNewPlan(value)}
                        placeholder="Select a plan"
                    >
                        <Select.Option value="free">Free</Select.Option>
                        <Select.Option value="basic">Basic</Select.Option>
                        <Select.Option value="pro">Pro</Select.Option>
                        <Select.Option value="enterprise">Enterprise</Select.Option>
                    </Select>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Confirm Deletion"
                open={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmLoading={actionLoading}
                okText="Delete"
                cancelText="Discard"
                okButtonProps={{ danger: true }}
            >
                <div className="py-4 text-center">
                    <DeleteOutlined className="text-red-500 text-5xl mb-4" />
                    <p>Are you sure you want to delete <strong>{selectedOrg?.name}</strong>?</p>
                    <p className="text-gray-500 text-sm mt-2">This action cannot be undone and will remove all associated data.</p>
                </div>
            </Modal>
        </div >
    )
}