import PageHeader from "@/components/(shared-components)/PageHeader";
import { useState } from "react";
import { OrganizationResponse } from "@/interfaces/organization";
import { getAllOrganizations } from "@/(api-handlers)/organizationHandler";
import { useEffect } from "react";
import { Button, Input, message, Tag } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Loading from "@/components/(shared-components)/Loading";
import EmptyState from "@/components/(shared-components)/EmptyState";

export default function SuperAdminView() {
    const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [filteredOrganizations, setFilteredOrganizations] = useState<OrganizationResponse[]>([]);
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
    }, [searchText, organizations]);
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
                                    <th scope="col" className="py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-10">
                                            <Loading text="Fetching organizations..." />
                                        </td>
                                    </tr>
                                ) : filteredOrganizations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-10">
                                            <EmptyState
                                                title={searchText ? "No organizations match your search" : "No organizations found"}
                                                description={searchText ? `No results for "${searchText}". Try a different keyword.` : "There are currently no organizations in the system."}
                                                onAction={() => router.push('/organizations/create')}
                                                actionText="Add Organization"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrganizations.map((org) => (
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
                                                <button className="text-primary hover:text-primary-dark font-medium">Edit</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    )
}