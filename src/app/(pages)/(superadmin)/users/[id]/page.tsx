/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState, use } from 'react';
import {
    Card, Typography, Tag, Avatar, Divider, Button,
    Breadcrumb, Badge, Tabs,
    Grid, Descriptions
} from 'antd';
import {
    User, Shield,
    Activity, ArrowLeft, Edit, MailCheck,
    Briefcase, Building2, MapPin, Fingerprint,
    CheckCircle2, AlertCircle,
    Key, Clock,
    DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserByID } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface UserDetailsPageProps {
    params: Promise<{ id: string }>;
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const screens = useBreakpoint();
    const [userData, setUserData] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const data = await getUserByID(id);
                setUserData(data);
            } catch (error: any) {
                handleErrorMessage(error, 'Failed to fetch user details');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loading text="Loading profile intelligence..." /></div>;
    if (!userData) {
        return (
            <div className="h-screen flex items-center justify-center p-8">
                <EmptyState
                    title="User Not Found"
                    description="The entity you are looking for does not exist or has been de-provisioned."
                    actions={<Button icon={<ArrowLeft className="size-4" />} onClick={() => router.back()}>Go Back</Button>}
                />
            </div>
        );
    }

    const roleColors = {
        superadmin: 'purple',
        admin: 'blue',
        manager: 'orange',
        attendant: 'cyan'
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header & Breadcrumbs */}
                <div className="mb-8">
                    <Breadcrumb className="mb-4! text-xs font-medium">
                        <Breadcrumb.Item><Link href="/users" className="text-slate-400 hover:text-primary">Users</Link></Breadcrumb.Item>
                        <Breadcrumb.Item className="text-slate-900 font-bold">{userData.first_name} {userData.last_name}</Breadcrumb.Item>
                    </Breadcrumb>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <Button
                                icon={<ArrowLeft className="size-4" />}
                                onClick={() => router.back()}
                                className="rounded-xl border-slate-200 h-12 w-12 flex items-center justify-center shrink-0 shadow-sm hover:shadow-md transition-all"
                            />
                            <div className="flex items-center gap-4">
                                <Avatar
                                    size={80}
                                    src={userData.profile_pic}
                                    className="bg-primary-light text-primary border-4 border-white shadow-xl ring-1 ring-slate-100 font-bold text-3xl shrink-0"
                                >
                                    {userData.first_name[0]}{userData.last_name[0]}
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight m-0 leading-tight">
                                            {userData.first_name} {userData.last_name}
                                        </h1>
                                        <Badge status={userData.is_active ? "success" : "default"} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Tag color={roleColors[userData.role]} className="rounded-full px-4 py-0.5 border-0 font-bold uppercase text-[10px] tracking-wider m-0">
                                            {userData.role}
                                        </Tag>
                                        <Text className="text-slate-400 font-medium text-sm flex items-center gap-1.5 ml-1">
                                            <Fingerprint className="size-3.5" /> ID: {userData.id}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button icon={<MailCheck className="size-4" />} className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl border-slate-200 font-medium">
                                Message
                            </Button>
                            <Button type="primary" icon={<Edit className="size-4" />} className="bg-primary flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-100">
                                Edit Status
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Core Info */}
                    <div className="lg:col-span-2 space-y-6!">
                        {/* Highlights Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Account Status', value: userData.is_active ? 'Active' : 'Deactivated', color: userData.is_active ? 'emerald' : 'rose', icon: <CheckCircle2 className="size-4" /> },
                                { label: 'Verification', value: userData.email_verified ? 'Verified' : 'Pending', color: userData.email_verified ? 'blue' : 'amber', icon: <AlertCircle className="size-4" /> },
                                { label: 'Last Engagement', value: userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never', color: 'indigo', icon: <Clock className="size-4" /> }
                            ].map((item, idx) => (
                                <Card key={item.label} className="border-0 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-all">
                                    <div className={`absolute top-0 right-0 p-3 opacity-5 text-${item.color}-600 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                                    <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1">{item.label}</Text>
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full bg-${item.color}-500 shadow-sm`} />
                                        <Title level={5} style={{ margin: 0 }} className="text-slate-800 font-bold tracking-tight">{item.value}</Title>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Detailed Information Tabs */}
                        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
                            <Tabs
                                defaultActiveKey="1"
                                className="profile-tabs px-6 pt-2"
                                items={[
                                    {
                                        key: '1',
                                        label: <span className="flex items-center gap-2 h-full"><User className="size-4" /> Identity Details</span>,
                                        children: (
                                            <div className="pb-8 pt-4">
                                                <Descriptions bordered column={screens.md ? 2 : 1} size="middle" labelStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#64748b' }}>
                                                    <Descriptions.Item label="Username">{userData.username}</Descriptions.Item>
                                                    <Descriptions.Item label="Email Address">{userData.email}</Descriptions.Item>
                                                    <Descriptions.Item label="Phone Number">{userData.phone_number || 'N/A'}</Descriptions.Item>
                                                    <Descriptions.Item label="Member Since">{new Date(userData.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Descriptions.Item>
                                                    <Descriptions.Item label="Current Role" span={2}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`size-2 rounded-full bg-${roleColors[userData.role]}-500`} />
                                                            <span className="capitalize">{userData.role} Permissions</span>
                                                        </div>
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </div>
                                        )
                                    },
                                    {
                                        key: '2',
                                        label: <span className="flex items-center gap-2 h-full"><Briefcase className="size-4" /> Employment</span>,
                                        children: userData.employee_profile ? (
                                            <div className="pb-8 pt-4 space-y-6">
                                                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 text-primary">
                                                            <Building2 className="size-7" />
                                                        </div>
                                                        <div>
                                                            <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Current Position</Text>
                                                            <Title level={4} style={{ margin: 0 }} className="text-slate-800">{userData.employee_profile.job_title || 'Employee'}</Title>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-8 text-center">
                                                        <div>
                                                            <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1">Employee Code</Text>
                                                            <Title level={5} style={{ margin: 0 }} className="text-primary font-mono tracking-tighter">{userData.employee_profile.employee_code}</Title>
                                                        </div>
                                                        <div>
                                                            <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1">Status</Text>
                                                            <Tag color="success" className="rounded-full px-3 py-0 border-0 font-bold text-[10px] uppercase m-0">{userData.employee_profile.employment_status}</Tag>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Descriptions bordered column={screens.md ? 2 : 1} size="middle" labelStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#64748b' }}>
                                                    <Descriptions.Item label="Department">{userData.employee_profile.department || 'N/A'}</Descriptions.Item>
                                                    <Descriptions.Item label="Employment Type"><span className="capitalize">{userData.employee_profile.employment_type || 'N/A'}</span></Descriptions.Item>
                                                    <Descriptions.Item label="Hire Date">{userData.employee_profile.hire_date ? new Date(userData.employee_profile.hire_date).toLocaleDateString() : 'N/A'}</Descriptions.Item>
                                                    <Descriptions.Item label="Organization ID">{userData.employee_profile.organization_id}</Descriptions.Item>
                                                    <Descriptions.Item label="Work Email">{userData.employee_profile.work_email || 'N/A'}</Descriptions.Item>
                                                    <Descriptions.Item label="Work Phone">{userData.employee_profile.work_phone || 'N/A'}</Descriptions.Item>
                                                </Descriptions>
                                            </div>
                                        ) : (
                                            <div className="py-12 border-t border-slate-100 text-center">
                                                <EmptyState
                                                    title="No Employment Profile"
                                                    description="This user has not been configured with an employee profile yet."
                                                    actions={<Button type="primary" onClick={() => router.push(`/users/setup-employee-profile`)}>Setup Profile</Button>}
                                                />
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </Card>

                        {/* Activities / Timeline */}
                        <Card className="rounded-2xl border-0 shadow-sm p-6">
                            <Title level={5} className="mb-6! text-slate-800 flex items-center gap-2"><Activity className="size-4 text-slate-400" /> Administrative Permissions</Title>
                            {userData.employee_profile ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Can Manage Inventory", value: userData.employee_profile.can_manage_inventory },
                                        { label: "Can Create Shops", value: userData.employee_profile.can_create_shop },
                                        { label: "Can Manage Users", value: userData.employee_profile.can_manage_users },
                                        { label: "Can View Intelligence", value: userData.employee_profile.can_view_reports },
                                    ].map((perm) => (
                                        <div key={perm.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-600">{perm.label}</span>
                                            {perm.value ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-tight">
                                                    <CheckCircle2 className="size-3.5" /> Granted
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                                    <AlertCircle className="size-3.5" /> Restricted
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Text className="text-slate-400 italic">No administrative metadata available.</Text>
                            )}
                        </Card>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6!">
                        {/* Organization Context */}
                        {userData.organization && (
                            <Card className="rounded-2xl shadow-sm border-0 bg-white p-6 overflow-hidden relative">
                                <div className="absolute -top-4 -right-4 size-24 bg-blue-50 rounded-full shrink-0" />
                                <Title level={5} className="mb-6! text-slate-800 relative flex items-center gap-2"><Building2 className="size-4 text-primary" /> Affiliation</Title>
                                <div className="space-y-4 relative">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1">Organization Name:</Text>
                                        <Text className="font-bold text-slate-800 truncate block">{userData.organization.name}</Text>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { icon: <Shield className="size-4" />, label: "Plan Type", value: <Tag className="m-0 uppercase font-bold text-[10px]">{userData.organization.plan_type}</Tag> },
                                            { icon: <MapPin className="size-4" />, label: "Region", value: userData.organization.address },
                                            { icon: <DollarSign className="size-4" />, label: "Currency", value: userData.organization.currency }
                                        ].map((item) => (
                                            <div key={item.label} className="flex flex-col space-y-1 items-start justify-between text-sm py-1">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <span className="text-slate-400">{item.icon}</span>
                                                    <span>{item.label}</span>
                                                </div>
                                                <span className="text-slate-800 font-semibold">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Security & Access */}
                        <Card className="rounded-2xl shadow-blue-600/5 shadow-2xl border-0 bg-slate-900! text-white p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Key className="size-24" /></div>
                            <Title level={5} className="text-white! mb-6!">Security Protocol</Title>
                            <div className="space-y-4 relative">
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Shield className="size-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <Text className="text-white/60! text-xs font-semibold block uppercase tracking-wider mb-0.5">Protection Level</Text>
                                        <Text className="text-white! font-bold">Standard Enterprise</Text>
                                    </div>
                                </div>
                                <Divider className="border-white/10 m-0" />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/50">MFA Status</span>
                                        <Tag color="default" className="bg-white/10 border-0 text-white text-[10px] font-bold m-0 uppercase px-2 py-0">Inactive</Tag>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/50">Access Token</span>
                                        <span className="text-indigo-400 font-mono text-xs">RSA-2048</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10 text-center">
                                <Text className="text-white/30! text-[10px] uppercase font-bold tracking-wide leading-none">Security Architecture by Paynest POS</Text>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
