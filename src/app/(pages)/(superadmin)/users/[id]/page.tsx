/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState, use } from 'react';
import {
    User, Shield,
    Activity, ArrowLeft, Edit, MailCheck,
    Briefcase, Building2, MapPin, Fingerprint,
    CheckCircle2, AlertCircle,
    Key, Clock,
    DollarSign,
    MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserByID } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import Loading from '@/components/(shared-components)/Loading';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface UserDetailsPageProps {
    params: Promise<{ id: string }>;
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
    const { id } = use(params);
    const router = useRouter();
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
                    actions={<Button variant="outline" className="gap-2" onClick={() => router.back()}><ArrowLeft className="size-4" /> Go Back</Button>}
                />
            </div>
        );
    }

    const roleColors: Record<string, string> = {
        superadmin: 'bg-purple-100 text-purple-800 border-purple-200',
        admin: 'bg-blue-100 text-blue-800 border-blue-200',
        manager: 'bg-orange-100 text-orange-800 border-orange-200',
        attendant: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };

    const getRoleColor = (role: string) => roleColors[role] || 'bg-slate-100 text-slate-800 border-slate-200';

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header & Breadcrumbs */}
                <div>
                    <nav className="flex text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-2">
                            <li className="inline-flex items-center">
                                <Link href="/users" className="hover:text-foreground transition-colors">Users</Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="mx-2">/</span>
                                    <span className="text-foreground font-medium">{userData.first_name} {userData.last_name}</span>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.back()}
                                className="h-10 w-10 rounded-md flex-shrink-0 mt-1"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-5">
                                <Avatar className="size-20 shadow-sm border border-slate-200">
                                    <AvatarImage src={userData.profile_pic} alt={`${userData.first_name} ${userData.last_name}`} />
                                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                        {userData.first_name[0]}{userData.last_name[0]}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                            {userData.first_name} {userData.last_name}
                                        </h1>
                                        <Badge variant={userData.is_active ? "default" : "secondary"} className={userData.is_active ? "bg-emerald-500 hover:bg-emerald-600 rounded-md" : "rounded-md"}>
                                            {userData.is_active ? 'Active' : 'Deactivated'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Badge variant="outline" className={`rounded-md px-3 capitalize font-semibold ${getRoleColor(userData.role)}`}>
                                            {userData.role}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            <Fingerprint className="size-4" />
                                            ID: {userData.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2 h-10 px-5 rounded-md">
                                <MailCheck className="size-4" />
                                Message
                            </Button>
                            {userData.employee_profile && (
                                <Link href={`/users/edit-employee-profile/${userData.id}`}>
                                    <Button className="gap-2 h-10 px-5 rounded-md shadow-sm">
                                        <Edit className="size-4" />
                                        Edit Profile
                                    </Button>
                                </Link>
                            )}
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-md">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column - Core Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Highlights Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Account Status', value: userData.is_active ? 'Active' : 'Restricted', color: userData.is_active ? 'text-emerald-500' : 'text-rose-500', icon: <CheckCircle2 className="size-4" /> },
                                { label: 'Verification', value: userData.email_verified ? 'Verified' : 'Pending', color: userData.email_verified ? 'text-blue-500' : 'text-amber-500', icon: <AlertCircle className="size-4" /> },
                                { label: 'Last Engagement', value: userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never', color: 'text-indigo-500', icon: <Clock className="size-4" /> }
                            ].map((item) => (
                                <Card key={item.label} className="p-0 border border-slate-200 shadow-sm rounded-md transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                                                <p className={`text-lg font-bold tracking-tight ${item.color}`}>{item.value}</p>
                                            </div>
                                            <div className="p-1.5 rounded-md bg-slate-50 text-slate-400">
                                                {item.icon}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Detailed Information Tabs */}
                        <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden">
                            <Tabs defaultValue="identity" className="w-full">
                                <div className="border-b px-5 py-3 bg-white">
                                    <TabsList className="bg-slate-100 p-1 w-full sm:w-auto h-auto rounded-md">
                                        <TabsTrigger value="identity" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1.5 text-sm font-semibold gap-2">
                                            <User className="size-4" /> Identity Details
                                        </TabsTrigger>
                                        <TabsTrigger value="employment" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1.5 text-sm font-semibold gap-2">
                                            <Briefcase className="size-4" /> Employment
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="identity" className="p-0 m-0 border-none outline-none">
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Username</p>
                                                <p className="font-semibold text-foreground">{userData.username}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                                <p className="font-semibold text-foreground">{userData.email}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                                <p className="font-semibold text-foreground">{userData.phone_number || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                                <p className="font-semibold text-foreground">{new Date(userData.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <div className="space-y-1 md:col-span-2 pt-4 border-t border-slate-100">
                                                <p className="text-sm font-medium text-muted-foreground mb-2">Current Role Level</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`rounded-md px-4 py-1 border-0 ring-1 ring-inset capitalize font-bold ${getRoleColor(userData.role)}`}>
                                                        {userData.role} Permissions
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="employment" className="p-0 m-0 border-none outline-none">
                                    {userData.employee_profile ? (
                                        <div className="p-5 space-y-6">
                                            <div className="bg-slate-50/50 rounded-md p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-slate-200">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-md bg-white shadow-sm flex items-center justify-center border border-slate-200 text-primary">
                                                        <Building2 className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Position</p>
                                                        <h3 className="text-lg font-bold tracking-tight text-foreground">{userData.employee_profile.job_title || 'Employee'}</h3>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 text-left">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Employee Code</p>
                                                        <p className="text-sm font-mono font-bold tracking-tight text-primary bg-primary/5 px-2.5 py-1 rounded-md">{userData.employee_profile.employee_code}</p>
                                                    </div>
                                                    <Separator orientation="vertical" className="h-10 hidden sm:block bg-slate-200" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Status</p>
                                                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0 uppercase text-[10px] font-bold px-2.5 rounded-sm">{userData.employee_profile.employment_status}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 px-1">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                                                    <p className="font-semibold text-foreground">{userData.employee_profile.department || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                                                    <p className="font-semibold text-foreground capitalize">{userData.employee_profile.employment_type || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Hire Date</p>
                                                    <p className="font-semibold text-foreground">{userData.employee_profile.hire_date ? new Date(userData.employee_profile.hire_date).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                                                    <p className="font-semibold text-foreground">{userData.employee_profile.organization_id}</p>
                                                </div>
                                                <div className="space-y-1 pt-4 border-t border-slate-100">
                                                    <p className="text-sm font-medium text-muted-foreground">Work Email</p>
                                                    <p className="font-semibold text-foreground">{userData.employee_profile.work_email || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1 pt-4 border-t border-slate-100">
                                                    <p className="text-sm font-medium text-muted-foreground">Work Phone</p>
                                                    <p className="font-semibold text-foreground">{userData.employee_profile.work_phone || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <EmptyState
                                                title="No Employment Profile"
                                                description="There is no employee record connected to this user yet."
                                                actions={<Button className="h-10 rounded-md" onClick={() => router.push(`/users/setup-employee-profile`)}>Setup Profile</Button>}
                                            />
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </Card>

                        {/* Activities / Timeline */}
                        <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
                            <CardHeader className="border-b bg-slate-50/50 pb-4">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Activity className="size-4 text-muted-foreground" /> Administrative Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                {userData.employee_profile ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { label: "Manage Inventory", value: userData.employee_profile.can_manage_inventory },
                                            { label: "Create Shops", value: userData.employee_profile.can_create_shop },
                                            { label: "Manage Users", value: userData.employee_profile.can_manage_users },
                                            { label: "View Intelligence", value: userData.employee_profile.can_view_reports },
                                        ].map((perm) => (
                                            <div key={perm.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                                                <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                                                {perm.value ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[10px] uppercase tracking-wider">
                                                        <CheckCircle2 className="size-3.5" /> Granted
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                                                        <AlertCircle className="size-3.5" /> Restricted
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-muted-foreground italic text-sm">No administrative metadata available.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Organization Context */}
                        {userData.organization && (
                            <Card className="border border-slate-200 shadow-sm rounded-md bg-white overflow-hidden relative group">
                                <div className="absolute -top-12 -right-12 size-32 bg-primary/5 rounded-full shrink-0 group-hover:scale-110 transition-transform duration-500" />
                                <CardHeader className="pb-3 relative">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Building2 className="size-4 text-primary" /> Affiliation Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative space-y-4 p-5 pt-0">
                                    <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Organization Name</p>
                                        <p className="font-semibold text-foreground text-sm tracking-tight truncate">{userData.organization.name}</p>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { icon: <Shield className="size-4" />, label: "Plan Tier", value: <Badge variant="secondary" className="uppercase font-semibold text-[10px] px-2 rounded-md">{userData.organization.plan_type}</Badge> },
                                            { icon: <MapPin className="size-4" />, label: "Region", value: <span className="text-sm font-medium">{userData.organization.address}</span> },
                                            { icon: <DollarSign className="size-4" />, label: "Currency", value: <span className="text-sm font-medium">{userData.organization.currency}</span> }
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                                    {item.icon}
                                                    <span>{item.label}</span>
                                                </div>
                                                {item.value}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Security & Access */}
                        <Card className="border border-slate-800 shadow-sm rounded-md bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute -top-8 -right-8 opacity-10 rotate-12 transition-transform duration-700 hover:rotate-45">
                                <Key className="size-32" />
                            </div>
                            <CardHeader className="pb-3 relative">
                                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">Security Protocol</CardTitle>
                            </CardHeader>
                            <CardContent className="relative space-y-5 p-5 pt-0">
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-md border border-white/10 backdrop-blur-sm">
                                    <div className="size-10 rounded-md bg-emerald-500/20 flex flex-shrink-0 items-center justify-center">
                                        <Shield className="size-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-emerald-400/80 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Protection Level</p>
                                        <p className="text-white font-medium text-sm leading-none tracking-tight">Standard Enterprise</p>
                                    </div>
                                </div>

                                <Separator className="bg-white/10" />

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60 font-medium">MFA Protocol</span>
                                        <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 uppercase text-[10px] font-semibold px-2 rounded-md shadow-none">Inactive</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60 font-medium">Access Token</span>
                                        <span className="text-indigo-300 font-mono text-xs font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md">RSA-2048</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
