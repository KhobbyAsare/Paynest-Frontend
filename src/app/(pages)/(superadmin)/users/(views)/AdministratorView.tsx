/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from 'react';
import { Input, Card, Button, Modal, Typography, Tooltip } from 'antd';
import { SearchOutlined, UserAddOutlined, CopyOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { getOrganizationUsers } from '@/(api-handlers)/userHandler';
import { generateInvitationCode } from '@/(api-handlers)/organizationHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import { GeneratedCodeResponse } from '@/interfaces/organization';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import Link from 'next/link';
import { toast } from 'sonner';

const { Text } = Typography;

export default function UsersAdministratorView() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    const [isInvitationModalVisible, setIsInvitationModalVisible] = useState(false);
    const [invitationCode, setInvitationCode] = useState<GeneratedCodeResponse | null>(null);
    const [generatingCode, setGeneratingCode] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getOrganizationUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(u =>
            u.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            u.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
            u.email.toLowerCase().includes(searchText.toLowerCase()) ||
            u.username.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [searchText, users]);

    const handleGenerateCode = async () => {
        if (!user?.organization?.id) {
            handleErrorMessage(null, 'Organization ID not found');
            return;
        }

        setGeneratingCode(true);
        try {
            const response = await generateInvitationCode(user.organization.id);
            setInvitationCode(response);
            setIsInvitationModalVisible(true);
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to generate invitation code');
        } finally {
            setGeneratingCode(false);
        }
    };

    const copyToClipboard = () => {
        if (invitationCode?.code) {
            navigator.clipboard.writeText(invitationCode.code);
            toast.success("Code copied to clipboard!");
        }
    };

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div>
            <PageHeader
                title='Users'
                description='Manage your organization users and their profiles.'
            >
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={handleGenerateCode}
                    loading={generatingCode}
                >
                    Generate Invitation Code
                </Button>
            </PageHeader>

            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <Input
                        placeholder="Search users by name, email or username..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ maxWidth: '400px' }}
                        allowClear
                    />
                </div>

                <div className="mt-4 flow-root px-2">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="relative min-w-full divide-y divide-gray-200 text-left">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-sm font-semibold text-gray-900 sm:pl-0">Full Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">Username</th>
                                        <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">Email Verified</th>
                                        <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">Employee Profile</th>
                                        <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-10">
                                                <Loading text="Fetching users..." />
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-10">
                                                <EmptyState
                                                    title={searchText ? "No users match your search" : "No users found"}
                                                    description={searchText ? `No results for "${searchText}". Try a different keyword.` : "There are currently no users in your organization."}
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        currentUsers.map((u) => (
                                            <tr key={u?.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    {u?.first_name} {u?.last_name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{u?.username}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{u?.email}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{u?.role}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {u?.email_verified ? (
                                                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Verified</span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Pending</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {u?.employee_profile ? (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Linked Profile</span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">No Profile</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <Tooltip title="View Details">
                                                        <Link href={`/users/${u.id}`}>
                                                            <Button
                                                                type="text"
                                                                icon={<EyeOutlined className="text-primary text-lg" />}
                                                            />
                                                        </Link>
                                                    </Tooltip>
                                                    {u?.employee_profile && (
                                                        <Tooltip title="Edit Profile">
                                                            <Link href={`/users/edit-employee-profile/${u.id}`}>
                                                                <Button
                                                                    type="text"
                                                                    icon={<EditOutlined className="text-primary text-lg" />}
                                                                />
                                                            </Link>
                                                        </Tooltip>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                {filteredUsers.length > itemsPerPage && (
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
                                    <span className="font-medium">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{' '}
                                    <span className="font-medium">{filteredUsers.length}</span> results
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
            </Card>

            {/* Invitation Code Modal */}
            <Modal
                title="Invitation Code Generated"
                open={isInvitationModalVisible}
                onOk={() => setIsInvitationModalVisible(false)}
                onCancel={() => setIsInvitationModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsInvitationModalVisible(false)}>
                        Close
                    </Button>,
                    <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={copyToClipboard}>
                        Copy Code
                    </Button>
                ]}
            >
                <div className="py-4 text-center">
                    <p className="mb-4 text-gray-600">Share this code with the user you want to invite to your organization.</p>
                    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200">
                        <Text copyable={{ text: invitationCode?.code }} className="text-4xl font-mono tracking-widest text-primary font-bold">
                            {invitationCode?.code}
                        </Text>
                    </div>
                    {invitationCode?.expires_at && (
                        <p className="mt-4 text-xs text-gray-400">
                            Expires on: {new Date(invitationCode.expires_at).toLocaleString()}
                        </p>
                    )}
                </div>
            </Modal>
        </div>
    );
}
