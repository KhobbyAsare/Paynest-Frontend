/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState, use } from 'react';
import { Form, Input, Select, DatePicker, Checkbox, message } from 'antd';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Briefcase, Key, Mail, Fingerprint, MapPin, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { getUserByID } from '@/(api-handlers)/userHandler';
import { updateEmployeeProfile } from '@/(api-handlers)/employeeProfileHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const { Option } = Select;

interface EditEmployeeProfileProps {
    params: Promise<{ id: string }>;
}

export default function EditEmployeeProfile({ params }: EditEmployeeProfileProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const [form] = Form.useForm();

    const [userData, setUserData] = useState<UserResponse | null>(null);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userRes, shopsRes] = await Promise.all([
                    getUserByID(id),
                    getOrganizationShops()
                ]);
                setUserData(userRes);
                setShops(shopsRes);

                if (userRes.employee_profile) {
                    form.setFieldsValue({
                        ...userRes.employee_profile,
                        role: userRes.role,
                        hire_date: userRes.employee_profile.hire_date ? dayjs(userRes.employee_profile.hire_date) : null,
                        termination_date: userRes.employee_profile.termination_date ? dayjs(userRes.employee_profile.termination_date) : null,
                    });
                } else {
                    message.warning("This user does not have an employee profile yet. Redirecting to setup...");
                    router.push(`/users/setup-employee-profile`);
                }
            } catch (error: any) {
                handleErrorMessage(error, 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, form, router]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const updateData = {
                ...values,
                hire_date: values.hire_date ? values.hire_date.toISOString() : null,
                termination_date: values.termination_date ? values.termination_date.toISOString() : null,
                can_create_shop: !!values.can_create_shop,
                can_manage_users: !!values.can_manage_users,
                can_view_reports: !!values.can_view_reports,
                can_manage_inventory: !!values.can_manage_inventory,
            };

            await updateEmployeeProfile(parseInt(id), updateData);
            message.success('Employee profile updated successfully!');
            router.push(`/users/${id}`);
        } catch (error: any) {
            handleErrorMessage(error, 'Failed to update employee profile');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="animate-pulse">Loading employee intelligence...</p>
        </div>
    );

    if (!userData) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <p className="text-xl font-semibold text-foreground">User Not Found</p>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Navigation and Header */}
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-muted-foreground hover:text-foreground gap-2 -ml-4"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Profile
                    </Button>
                    <PageHeader
                        title='Edit Employment Data'
                        description={`Modify infrastructure access and professional details for ${userData.first_name}.`}
                    />
                </div>

                {/* Profile Snapshot Card */}
                <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            <Avatar className="size-16 shadow-sm">
                                <AvatarImage src={userData.profile_pic} />
                                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                                    {userData.first_name[0]}{userData.last_name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-semibold tracking-tight text-foreground">{userData.first_name} {userData.last_name}</h2>
                                    <Badge variant={userData.is_active ? "default" : "secondary"} className={userData.is_active ? "bg-emerald-500 hover:bg-emerald-600 rounded-md" : "rounded-md"}>
                                        {userData.is_active ? 'Active' : 'Deactivated'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5"><Mail className="size-3.5" /> {userData.email}</div>
                                    <div className="flex items-center gap-1.5"><Fingerprint className="size-3.5" /> {userData.username}</div>
                                    <Badge variant="outline" className="uppercase font-medium text-[10px] tracking-wider bg-slate-50 rounded-md">
                                        {userData.role}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="space-y-6"
                    requiredMark={false}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Main Context Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border border-slate-200 shadow-sm rounded-md bg-white">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Briefcase className="size-4 text-muted-foreground" /> Operational Context
                                    </CardTitle>
                                    <CardDescription>Professional assignment and taxonomy variables.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                    <Form.Item name="employee_code" label={<span className="font-medium text-slate-700">Identity Code</span>} rules={[{ required: true, message: 'Required' }]}>
                                        <Input className="h-10 rounded-md border-slate-200" placeholder="e.g. EMP-001" />
                                    </Form.Item>
                                    <Form.Item name="department" label={<span className="font-medium text-slate-700">Department</span>}>
                                        <Input className="h-10 rounded-md border-slate-200" placeholder="e.g. Sales, Inventory" />
                                    </Form.Item>
                                    <Form.Item name="job_title" label={<span className="font-medium text-slate-700">Current Title</span>} rules={[{ required: true, message: 'Required' }]}>
                                        <Input className="h-10 rounded-md border-slate-200" placeholder="e.g. Store Manager" />
                                    </Form.Item>
                                    <Form.Item name="hire_date" label={<span className="font-medium text-slate-700">Integration Date</span>}>
                                        <DatePicker className="w-full h-10 rounded-md border-slate-200" />
                                    </Form.Item>
                                    <Form.Item name="employment_type" label={<span className="font-medium text-slate-700">Contract Vector</span>}>
                                        <Select className="h-10 rounded-md">
                                            <Option value="full_time">Full-time Employee</Option>
                                            <Option value="part_time">Part-time Coverage</Option>
                                            <Option value="contract">Independent Contract</Option>
                                            <Option value="freelance">Freelance Retainer</Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="employment_status" label={<span className="font-medium text-slate-700">Activity State</span>}>
                                        <Select className="h-10 rounded-md">
                                            <Option value="active">Active Execution</Option>
                                            <Option value="probation">Probationary Period</Option>
                                            <Option value="on-leave">On Approved Leave</Option>
                                            <Option value="terminated">Terminated Access</Option>
                                        </Select>
                                    </Form.Item>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 shadow-sm rounded-md bg-white">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <MapPin className="size-4 text-muted-foreground" /> Station Details
                                    </CardTitle>
                                    <CardDescription>Primary communication channels and location mapping.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                    <Form.Item name="work_email" label={<span className="font-medium text-slate-700">Work Email</span>}>
                                        <Input className="h-10 rounded-md border-slate-200" placeholder="work@organization.com" />
                                    </Form.Item>
                                    <Form.Item name="work_phone" label={<span className="font-medium text-slate-700">Extension / Phone</span>}>
                                        <Input className="h-10 rounded-md border-slate-200" placeholder="Official contact number" />
                                    </Form.Item>
                                    <div className="md:col-span-2">
                                        <Form.Item name="shop_id" label={<span className="font-medium text-slate-700">Assigned Facility</span>} rules={[{ required: true, message: 'Please assign a shop' }]}>
                                            <Select
                                                className="h-10 rounded-md"
                                                placeholder="Select the operational facility"
                                                showSearch
                                                optionFilterProp="children"
                                            >
                                                {shops.map(shop => (
                                                    <Option key={shop.id} value={shop.id}>{shop.name} ({shop.location})</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Security Column */}
                        <div className="space-y-6">
                            <Card className="border border-slate-200 shadow-sm rounded-md bg-white overflow-hidden">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Key className="size-4 text-muted-foreground" /> Clearance Protocol
                                    </CardTitle>
                                    <CardDescription>System access restrictions.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <Form.Item
                                        name="role"
                                        label={<span className="font-medium text-slate-700">Base System Tier</span>}
                                        rules={[{ required: true, message: 'Required' }]}
                                        className="mb-4"
                                    >
                                        <Select className="h-10 rounded-md">
                                            <Option value="admin">Administrator Class</Option>
                                            <Option value="manager">Management Logic</Option>
                                            <Option value="attendant">Standard Attendant</Option>
                                        </Select>
                                    </Form.Item>

                                    <div className="bg-amber-50 rounded-md p-3 border border-amber-100">
                                        <p className="text-sm text-amber-800">
                                            Modifying tier architecture propagates immediately across all instances.
                                        </p>
                                    </div>

                                    <Separator className="my-5 block" />

                                    <h3 className="text-sm font-semibold text-foreground mb-3 text-muted-foreground">Action Grants</h3>

                                    <div className="space-y-3 p-0">
                                        <Form.Item name="can_create_shop" valuePropName="checked" className="m-0 bg-transparent">
                                            <Checkbox className="font-medium text-sm text-slate-700">Authorize Shop Creation</Checkbox>
                                        </Form.Item>
                                        <Form.Item name="can_manage_users" valuePropName="checked" className="m-0">
                                            <Checkbox className="font-medium text-sm text-slate-700">Manage Sub-Identities</Checkbox>
                                        </Form.Item>
                                        <Form.Item name="can_view_reports" valuePropName="checked" className="m-0">
                                            <Checkbox className="font-medium text-sm text-slate-700">Access Global Analytics</Checkbox>
                                        </Form.Item>
                                        <Form.Item name="can_manage_inventory" valuePropName="checked" className="m-0">
                                            <Checkbox className="font-medium text-sm text-slate-700">Modify Inventory Structures</Checkbox>
                                        </Form.Item>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 shadow-sm rounded-md bg-white">
                                <CardContent className="p-5">
                                    <Button
                                        className="w-full h-10 rounded-md font-medium"
                                        type="submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                                        {submitting ? 'Saving changes...' : 'Save Profile Changes'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}
