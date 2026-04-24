"use client"

import { useEffect, useState, use } from 'react';
import {
    ArrowLeft, Edit, Building2, MapPin, Fingerprint,
    CheckCircle2, XCircle, Key, Clock, Mail, Phone,
    Calendar, Briefcase, Shield, DollarSign, Hash,
    BadgeCheck, AlertTriangle, Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserByID } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDetailsPageProps {
    params: Promise<{ id: string }>;
}

const ROLE_CONFIG: Record<string, { badge: string; ring: string; label: string }> = {
    superadmin: { badge: 'border-primary/30 bg-primary/10 text-primary', ring: 'ring-primary/30', label: 'Super Admin' },
    admin:      { badge: 'border-info/30 bg-info/10 text-info',          ring: 'ring-info/30',    label: 'Administrator' },
    manager:    { badge: 'border-warning/30 bg-warning/10 text-warning-foreground', ring: 'ring-warning/30', label: 'Manager' },
    attendant:  { badge: 'border-success/30 bg-success/10 text-success',  ring: 'ring-success/30', label: 'Attendant' },
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value || '—'}</p>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Card className="rounded-2xl">
                <CardContent className="p-6">
                    <div className="flex items-center gap-5">
                        <Skeleton className="size-20 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-48 rounded" />
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [userData, setUserData] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = await getUserByID(id) as any;
                setUserData(data);
            } catch (error) {
                handleErrorMessage(error, 'Failed to fetch user details');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (loading) return <LoadingSkeleton />;

    if (!userData) {
        return (
            <div className="flex items-center justify-center py-24">
                <EmptyState
                    title="User Not Found"
                    description="This user does not exist or has been removed."
                    actions={
                        <Button variant="outline" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="size-4" /> Go Back
                        </Button>
                    }
                />
            </div>
        );
    }

    const role = userData.role?.toLowerCase() ?? 'attendant';
    const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.attendant;
    const initials = `${userData.first_name?.[0] ?? ''}${userData.last_name?.[0] ?? ''}`.toUpperCase();
    const fullName = `${userData.first_name} ${userData.last_name}`;

    const stats = [
        {
            label: 'Account',
            value: userData.is_active ? 'Active' : 'Inactive',
            icon: userData.is_active ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />,
            color: userData.is_active ? 'text-success' : 'text-destructive',
            bg: userData.is_active ? 'bg-success/10' : 'bg-destructive/10',
        },
        {
            label: 'Email',
            value: userData.email_verified ? 'Verified' : 'Unverified',
            icon: userData.email_verified ? <BadgeCheck className="size-5" /> : <AlertTriangle className="size-5" />,
            color: userData.email_verified ? 'text-info' : 'text-warning-foreground',
            bg: userData.email_verified ? 'bg-info/10' : 'bg-warning/10',
        },
        {
            label: 'Last Login',
            value: userData.last_login
                ? new Date(userData.last_login).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Never',
            icon: <Clock className="size-5" />,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href="/users" className="hover:text-foreground transition-colors">Users</Link>
                <span>/</span>
                <span className="text-foreground font-medium">{fullName}</span>
            </nav>

            {/* Hero Card */}
            <Card className="rounded-2xl overflow-hidden p-0">
                {/* Coloured top stripe based on role */}
                <div className={`h-1.5 w-full ${role === 'superadmin' ? 'bg-primary' : role === 'admin' ? 'bg-info' : role === 'manager' ? 'bg-warning' : 'bg-success'}`} />

                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        {/* Left: avatar + identity */}
                        <div className="flex items-center gap-5">
                            <Avatar className={`size-20 ring-4 ${roleConfig.ring} ring-offset-2 ring-offset-background shrink-0`}>
                                <AvatarImage src={userData.profile_pic ?? undefined} alt={fullName} />
                                <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                    <h1 className="text-xl font-bold text-foreground tracking-tight">{fullName}</h1>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full text-xs font-semibold capitalize ${roleConfig.badge}`}
                                    >
                                        {roleConfig.label}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full text-xs font-semibold ${userData.is_active ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}
                                    >
                                        {userData.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                    <Fingerprint className="size-3.5" />
                                    <span>ID #{userData.id}</span>
                                    <span className="mx-1">·</span>
                                    <span>@{userData.username}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="icon" onClick={() => router.back()} className="size-9 rounded-xl">
                                <ArrowLeft className="size-4" />
                            </Button>
                            {userData.employee_profile && (
                                <Button asChild className="rounded-xl gap-2">
                                    <Link href={`/users/edit-employee-profile/${userData.id}`}>
                                        <Edit className="size-4" />
                                        Edit Profile
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                    <Card key={s.label} className="rounded-2xl p-0">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`size-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Left: tabs */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Identity / Employment tabs */}
                    <Card className="rounded-2xl overflow-hidden p-0">
                        <Tabs defaultValue="identity">
                            <div className="border-b px-5 pt-4 pb-0 bg-muted/30">
                                <TabsList className="bg-transparent h-auto gap-1 p-0 border-0 rounded-none">
                                    {[
                                        { value: 'identity', label: 'Identity', icon: <Fingerprint className="size-3.5" /> },
                                        { value: 'employment', label: 'Employment', icon: <Briefcase className="size-3.5" /> },
                                    ].map((t) => (
                                        <TabsTrigger
                                            key={t.value}
                                            value={t.value}
                                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none px-4 pb-3 text-sm font-medium text-muted-foreground gap-1.5"
                                        >
                                            {t.icon} {t.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {/* Identity tab */}
                            <TabsContent value="identity" className="m-0 p-6">
                                <div className="divide-y divide-border">
                                    <InfoRow icon={<Mail className="size-4" />} label="Email Address" value={userData.email} />
                                    <InfoRow icon={<Phone className="size-4" />} label="Phone Number" value={userData.phone_number} />
                                    <InfoRow icon={<Hash className="size-4" />} label="Username" value={`@${userData.username}`} />
                                    <InfoRow
                                        icon={<Calendar className="size-4" />}
                                        label="Member Since"
                                        value={new Date(userData.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    />
                                    <InfoRow
                                        icon={<Clock className="size-4" />}
                                        label="Last Login"
                                        value={userData.last_login ? new Date(userData.last_login).toLocaleString() : 'Never'}
                                    />
                                </div>

                                <div className="mt-5 pt-5 border-t">
                                    <p className="text-xs text-muted-foreground mb-3">Role & Access Level</p>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${roleConfig.badge}`}
                                    >
                                        {roleConfig.label} — {role} permissions
                                    </Badge>
                                </div>
                            </TabsContent>

                            {/* Employment tab */}
                            <TabsContent value="employment" className="m-0">
                                {userData.employee_profile ? (
                                    <div className="p-6 space-y-5">
                                        {/* Position banner */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-xl border">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Briefcase className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-0.5">Position</p>
                                                    <p className="font-semibold text-foreground">{userData.employee_profile.job_title || 'Employee'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Employee Code</p>
                                                    <p className="font-mono text-sm font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                                                        {userData.employee_profile.employee_code}
                                                    </p>
                                                </div>
                                                <Separator orientation="vertical" className="h-8 hidden sm:block" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                                    <Badge variant="outline" className="rounded-full border-success/30 bg-success/10 text-success capitalize text-xs">
                                                        {userData.employee_profile.employment_status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-border">
                                            <InfoRow icon={<Building2 className="size-4" />} label="Department" value={userData.employee_profile.department} />
                                            <InfoRow icon={<Briefcase className="size-4" />} label="Employment Type" value={userData.employee_profile.employment_type} />
                                            <InfoRow
                                                icon={<Calendar className="size-4" />}
                                                label="Hire Date"
                                                value={userData.employee_profile.hire_date ? new Date(userData.employee_profile.hire_date).toLocaleDateString() : null}
                                            />
                                            <InfoRow icon={<Mail className="size-4" />} label="Work Email" value={userData.employee_profile.work_email} />
                                            <InfoRow icon={<Phone className="size-4" />} label="Work Phone" value={userData.employee_profile.work_phone} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-16 text-center">
                                        <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                            <Briefcase className="size-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-semibold text-foreground mb-1">No Employment Profile</p>
                                        <p className="text-sm text-muted-foreground mb-4">No employee record is linked to this user.</p>
                                        <Button variant="outline" size="sm" onClick={() => router.push('/users/setup-employee-profile')}>
                                            Set up Profile
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </Card>

                    {/* Permissions card */}
                    {userData.employee_profile && (
                        <Card className="rounded-2xl p-0">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Activity className="size-4 text-muted-foreground" />
                                    Access Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { label: 'Manage Inventory', value: userData.employee_profile.can_manage_inventory },
                                        { label: 'Create Shops',     value: userData.employee_profile.can_create_shop },
                                        { label: 'Manage Users',    value: userData.employee_profile.can_manage_users },
                                        { label: 'View Reports',    value: userData.employee_profile.can_view_reports },
                                    ].map((perm) => (
                                        <div key={perm.label} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                                            <span className="text-sm font-medium text-foreground">{perm.label}</span>
                                            {perm.value ? (
                                                <div className="flex items-center gap-1.5 text-success text-xs font-semibold">
                                                    <CheckCircle2 className="size-3.5" /> Granted
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                                                    <XCircle className="size-3.5" /> Denied
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="flex flex-col gap-6">

                    {/* Organization */}
                    {userData.organization && (
                        <Card className="rounded-2xl p-0">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Building2 className="size-4 text-primary" />
                                    Organization
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="p-3 bg-muted rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                                    <p className="font-semibold text-foreground text-sm truncate">{userData.organization.name}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1.5 text-muted-foreground"><Shield className="size-3.5" /> Plan</span>
                                        <Badge variant="outline" className="capitalize text-xs rounded-full">{userData.organization.plan_type}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1.5 text-muted-foreground"><DollarSign className="size-3.5" /> Currency</span>
                                        <span className="font-medium text-foreground">{userData.organization.currency}</span>
                                    </div>
                                    <div className="flex items-start justify-between text-sm gap-3">
                                        <span className="flex items-center gap-1.5 text-muted-foreground shrink-0"><MapPin className="size-3.5" /> Address</span>
                                        <span className="font-medium text-foreground text-right text-xs leading-relaxed">{userData.organization.address}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security — intentional dark card */}
                    <Card className="rounded-2xl overflow-hidden p-0 bg-slate-900 border-slate-800 text-white">
                        <div className="absolute -top-6 -right-6 opacity-[0.07]">
                            <Key className="size-28" />
                        </div>
                        <CardHeader className="px-6 py-4 border-b border-white/10 relative">
                            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                                <Key className="size-4 text-white/60" />
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 relative space-y-4">
                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                                <div className="size-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Shield className="size-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest mb-0.5">Protection</p>
                                    <p className="text-sm font-semibold text-white">Standard Enterprise</p>
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/50">MFA</span>
                                    <Badge className="bg-white/10 text-white/70 hover:bg-white/10 border-0 text-[10px] font-semibold rounded-full shadow-none">
                                        Inactive
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/50">Token</span>
                                    <span className="text-indigo-300 font-mono text-xs font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                                        RSA-2048
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/50">Email Verified</span>
                                    {userData.email_verified ? (
                                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="size-3.5" /> Yes
                                        </span>
                                    ) : (
                                        <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                                            <AlertTriangle className="size-3.5" /> No
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
