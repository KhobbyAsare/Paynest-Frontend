/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from 'react';
import { Input, Card, message, Button, Tooltip } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { getAllUsers } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import Link from 'next/link';

export default function SuperAdminPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error: any) {
            message.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase()) ||
            user.username.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredUsers(filtered);
        setCurrentPage(1); // Reset to first page on search
    }, [searchText, users]);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div >
            <PageHeader title='User Management' description='Manage and monitor all platform users in one place.' />

            <Card>
                <Input
                    placeholder="Search users by name, email or username..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ maxWidth: '400px' }}
                    allowClear
                />
                <div className="mt-8! flow-root px-2">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="relative min-w-full divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            Full Name
                                        </th>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            Username
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Role
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Email
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Email Verified
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Organization
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="py-10">
                                                <Loading text="Fetching users..." />
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-10">
                                                <EmptyState
                                                    title={searchText ? "No users match your search" : "No users found"}
                                                    description={searchText ? `No results for "${searchText}". Try a different keyword.` : "There are currently no users in the system."}
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        currentUsers.map((user) => (
                                            <tr key={user?.email}>
                                                <td className="whitespace-wrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    {user?.first_name}{" "}{user?.last_name}
                                                </td>
                                                <td className="whitespace-wrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    {user?.username}
                                                </td>
                                                <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{user?.role}</td>
                                                <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{user?.email}</td>
                                                <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{user?.phone_number}</td>
                                                <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{user?.email_verified ? "Verified" : "Not Verified"}</td>
                                                <td className="whitespace-wrap px-3 py-4 text-sm text-gray-500">{user?.employee_profile?.organization_id ? user?.employee_profile?.organization_id : "N/A"}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <Tooltip title="View Details">
                                                        <Link href={`/users/${user.id}`}>
                                                            <Button
                                                                type="text"
                                                                icon={<EyeOutlined className="text-primary text-lg" />}
                                                            />
                                                        </Link>
                                                    </Tooltip>
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
                                    {/* Page numbers could be added here for a more complete UX */}
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
        </div>
    );
}