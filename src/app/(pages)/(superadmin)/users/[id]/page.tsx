"use client"

import { useEffect, useState, use } from 'react';
import {
    ArrowLeft, Edit, Building2, MapPin, Fingerprint,
    CheckCircle2, XCircle, Key, Clock, Mail, Phone,
    Calendar, Briefcase, Shield, Hash,
    BadgeCheck, AlertTriangle, Activity, Crown,
    Store, Users, Globe, Copy, Check, LayoutDashboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserByID } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
    BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from '@/lib/utils';

interface UserDetailsPageProps {
    params: Promise<{ id: string }>;
}

const ROLE_CONFIG: Record<string, {
    badge: string; avatar: string; label: string; icon: React.ElementType;
}> = {
    superadmin: {
        badge:  'border-primary/30 bg-primary/10 text-primary',
        avatar: 'bg-primary/15 text-primary',
        label:  'Super Admin',
        icon:   Crown,
    },
    admin: {
        badge:  'border-info/30 bg-info/10 text-info',
        avatar: 'bg-info/15 text-info',
        label:  'Administrator',
        icon:   Shield,
    },
    manager: {
        badge:  'border-success/30 bg-success/10 text-success',
        avatar: 'bg-success/15 text-success',
        label:  'Manager',
        icon:   Briefcase,
    },
    attendant: {
        badge:  'border-border bg-muted text-muted-foreground',
        avatar: 'bg-muted text-muted-foreground',
        label:  'Attendant',
        icon:   Activity,
    },
};

const PLAN_BADGE: Record<string, string> = {
    free:       'border-border bg-muted text-muted-foreground',
    basic:      'border-info/30 bg-info/10 text-info',
    pro:        'border-primary/30 bg-primary/10 text-primary',
    enterprise: 'border-warning/30 bg-warning/10 text-warning-foreground',
};

function fmtDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso?: string | null) {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CopyField({ icon: Icon, text, label }: { icon: React.ElementType; text: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied to clipboard`);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={`Copy ${label.toLowerCase()}`}
                    className="group inline-flex items-center gap-1 rounded-md px-1 -mx-1 hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Icon className="size-3" /> {text}
                    {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3 opacity-0 group-hover:opacity-100" />}
                </button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copied!' : `Copy ${label.toLowerCase()}`}</TooltipContent>
        </Tooltip>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
                <p className="text-sm font-medium text-foreground truncate mt-0.5">{value || '—'}</p>
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, className }: {
    title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
    return (
        <Card className={cn("gap-0 p-0", className)}>
            <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {children}
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-5 w-40 rounded" />
            <div>
                <Skeleton className="h-32 sm:h-40 w-full rounded-2xl" />
                <div className="flex items-center gap-4 mt-4">
                    <Skeleton className="size-16 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
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
        (async () => {
            setLoading(true);
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setUserData(await getUserByID(id) as any);
            } catch (error) {
                handleErrorMessage(error, 'Failed to fetch user details');
            } finally {
                setLoading(false);
            }
        })();
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

    const role       = userData.role?.toLowerCase() ?? 'attendant';
    const cfg        = ROLE_CONFIG[role] ?? ROLE_CONFIG.attendant;
    const RoleIcon   = cfg.icon;
    const initials   = `${userData.first_name?.[0] ?? ''}${userData.last_name?.[0] ?? ''}`.toUpperCase();
    const fullName   = `${userData.first_name} ${userData.last_name}`.trim();
    const ep         = userData.employee_profile;

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-6">

            {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboard" className="inline-flex items-center gap-1.5">
                                <LayoutDashboard className="size-3.5" /> Dashboard
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/users">Users</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="truncate max-w-[200px]">{fullName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div>
                {/* Cover photo */}
                <div className="h-32 sm:h-40 w-full overflow-hidden rounded-2xl">
                    <img
                        src="https://images.unsplash.com/photo-1784296868202-bf463f3f59bf?q=80&w=848&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="flex flex-col gap-5 mt-4 md:flex-row md:items-center md:justify-between">
                    {/* Avatar + identity */}
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold",
                            cfg.avatar
                        )}>
                            {initials || <Users className="size-7" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold text-foreground leading-tight">{fullName}</h1>
                                <Badge variant="outline" className={cn("rounded-full text-xs font-semibold capitalize gap-1", cfg.badge)}>
                                    <RoleIcon className="size-3" />
                                    {cfg.label}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={cn("rounded-full text-xs font-semibold",
                                        userData.is_active
                                            ? "border-success/30 bg-success/10 text-success"
                                            : "border-destructive/30 bg-destructive/10 text-destructive"
                                    )}
                                >
                                    {userData.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium mt-1">{userData.email}</p>
                            <div className="text-muted-foreground text-xs mt-1 flex items-center gap-2">
                                <CopyField icon={Fingerprint} text={`ID #${userData.id}`} label="User ID" />
                                <span>·</span>
                                <CopyField icon={Hash} text={`@${userData.username}`} label="Username" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => router.back()}>
                            <ArrowLeft className="size-4" /> Back
                        </Button>
                        {ep && (
                            <Button asChild size="sm" className="gap-2">
                                <Link href={`/users/edit-employee-profile/${userData.id}`}>
                                    <Edit className="size-4" /> Edit Profile
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Quick-stat chips ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Account Status',
                        value: userData.is_active ? 'Active' : 'Inactive',
                        icon: userData.is_active ? CheckCircle2 : XCircle,
                        color: userData.is_active ? 'text-success' : 'text-destructive',
                        bg:    userData.is_active ? 'bg-success/10' : 'bg-destructive/10',
                    },
                    {
                        label: 'Email Verified',
                        value: userData.email_verified ? 'Verified' : 'Unverified',
                        icon:  userData.email_verified ? BadgeCheck : AlertTriangle,
                        color: userData.email_verified ? 'text-info' : 'text-warning-foreground',
                        bg:    userData.email_verified ? 'bg-info/10' : 'bg-warning/10',
                    },
                    {
                        label: 'Employee Profile',
                        value: ep ? 'Linked' : 'None',
                        icon:  ep ? Briefcase : XCircle,
                        color: ep ? 'text-primary' : 'text-muted-foreground',
                        bg:    ep ? 'bg-primary/10' : 'bg-muted',
                    },
                    {
                        label: 'Last Login',
                        value: userData.last_login ? fmtDate(userData.last_login) : 'Never',
                        icon:  Clock,
                        color: 'text-muted-foreground',
                        bg:    'bg-muted',
                    },
                ].map(s => {
                    const Icon = s.icon;
                    return (
                        <Card key={s.label} className="p-0">
                            <CardContent className="px-4 py-4 flex items-center gap-3">
                                <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                                    <Icon className={cn("size-5", s.color)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-semibold">{s.label}</p>
                                    <p className={cn("text-sm font-bold mt-0.5 truncate", s.color)}>{s.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Main grid ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Left column (2/3) ─────────────────────────────────────── */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Contact & Identity */}
                    <SectionCard title="Contact & Identity" icon={Mail}>
                        <InfoItem icon={Mail}    label="Email Address" value={userData.email} />
                        <InfoItem icon={Phone}   label="Phone Number"  value={userData.phone_number} />
                        <InfoItem icon={Hash}    label="Username"      value={`@${userData.username}`} />
                        <InfoItem icon={Calendar} label="Member Since" value={fmtDate(userData.created_at, { day: 'numeric', month: 'long', year: 'numeric' })} />
                        <InfoItem icon={Clock}   label="Last Login"    value={fmtDateTime(userData.last_login)} />
                        <InfoItem icon={Globe}   label="Role"          value={cfg.label} />
                    </SectionCard>

                    {/* Employment */}
                    {ep ? (
                        <SectionCard title="Employment Details" icon={Briefcase}>
                            {/* Position banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/40 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Briefcase className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Position</p>
                                        <p className="font-semibold text-foreground text-sm">{ep.job_title || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Employee Code</p>
                                        <p className="font-mono text-xs font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-lg border border-primary/20">
                                            {ep.employee_code}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                                        <Badge variant="outline" className="rounded-full border-success/30 bg-success/10 text-success capitalize text-xs">
                                            {ep.employment_status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <InfoItem icon={Building2}  label="Department"       value={ep.department} />
                            <InfoItem icon={Briefcase}  label="Employment Type"  value={ep.employment_type} />
                            <InfoItem icon={Calendar}   label="Hire Date"        value={fmtDate(ep.hire_date)} />
                            <InfoItem icon={Mail}       label="Work Email"       value={ep.work_email} />
                            <InfoItem icon={Phone}      label="Work Phone"       value={ep.work_phone} />
                        </SectionCard>
                    ) : (
                        <SectionCard title="Employment Details" icon={Briefcase}>
                            <div className="py-10 text-center">
                                <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                    <Briefcase className="size-6 text-muted-foreground" />
                                </div>
                                <p className="font-semibold text-foreground mb-1">No Employment Profile</p>
                                <p className="text-sm text-muted-foreground mb-4">No employee record is linked to this user.</p>
                                <Button variant="outline" size="sm" onClick={() => router.push('/users/setup-employee-profile')}>
                                    Set up Profile
                                </Button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Access Permissions */}
                    {ep && (
                        <SectionCard title="Access Permissions" icon={Activity}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: 'Manage Inventory', value: ep.can_manage_inventory, icon: Store },
                                    { label: 'Create Shops',     value: ep.can_create_shop,      icon: Building2 },
                                    { label: 'Manage Users',     value: ep.can_manage_users,     icon: Users },
                                    { label: 'View Reports',     value: ep.can_view_reports,     icon: Activity },
                                ].map(perm => {
                                    const PermIcon = perm.icon;
                                    return (
                                        <div key={perm.label} className={cn(
                                            "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                                            perm.value ? "border-success/20 bg-success/5" : "border-border bg-muted/30"
                                        )}>
                                            <div className="flex items-center gap-2.5">
                                                <PermIcon className={cn("size-4", perm.value ? "text-success" : "text-muted-foreground/50")} />
                                                <span className="text-sm font-medium text-foreground">{perm.label}</span>
                                            </div>
                                            {perm.value ? (
                                                <div className="flex items-center gap-1 text-success text-xs font-semibold">
                                                    <CheckCircle2 className="size-3.5" /> Granted
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                                                    <XCircle className="size-3.5" /> Denied
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    )}
                </div>

                {/* ── Right sidebar (1/3) ───────────────────────────────────── */}
                <div className="flex flex-col gap-6">

                    {/* Organization */}
                    {userData.organization ? (
                        <SectionCard title="Organization" icon={Building2}>
                            {/* Org name badge */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border mb-4">
                                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                                    {userData.organization.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground text-sm truncate">{userData.organization.name}</p>
                                    <p className="text-muted-foreground text-xs truncate">{userData.organization.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                        <Shield className="size-3.5" /> Plan
                                    </span>
                                    <Badge variant="outline" className={cn("capitalize text-xs rounded-full font-medium", PLAN_BADGE[userData.organization.plan_type] ?? 'border-border bg-muted text-muted-foreground')}>
                                        {userData.organization.plan_type}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                        <Globe className="size-3.5" /> Currency
                                    </span>
                                    <span className="font-semibold text-foreground text-sm">{userData.organization.currency}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                        <Store className="size-3.5" /> Max Shops
                                    </span>
                                    <span className="font-semibold text-foreground text-sm">{userData.organization.max_shops}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                        <Users className="size-3.5" /> Max Users
                                    </span>
                                    <span className="font-semibold text-foreground text-sm">{userData.organization.max_users}</span>
                                </div>
                                {userData.organization.address && (
                                    <div className="pt-2 border-t">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1 mb-1">
                                            <MapPin className="size-3" /> Address
                                        </p>
                                        <p className="text-xs text-foreground leading-relaxed">{userData.organization.address}</p>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    ) : (
                        <SectionCard title="Organization" icon={Building2}>
                            <div className="py-6 text-center">
                                <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                                    <Building2 className="size-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">Not linked to any organization</p>
                            </div>
                        </SectionCard>
                    )}

                    {/* Security */}
                    <SectionCard title="Security" icon={Key}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Email Verified</span>
                                {userData.email_verified ? (
                                    <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                                        <CheckCircle2 className="size-3.5" /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-warning-foreground text-xs font-semibold">
                                        <AlertTriangle className="size-3.5" /> Unverified
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Account Status</span>
                                {userData.is_active ? (
                                    <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                                        <CheckCircle2 className="size-3.5" /> Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-semibold">
                                        <XCircle className="size-3.5" /> Inactive
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">MFA</span>
                                <Badge variant="outline" className="text-xs rounded-full border-border text-muted-foreground">
                                    Not configured
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Token Type</span>
                                <span className="font-mono text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded border border-primary/20">
                                    JWT HS256
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Profile Last Updated</p>
                                <p className="text-xs text-foreground font-medium">{fmtDateTime(userData.updated_at)}</p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Account timestamps */}
                    <SectionCard title="Timeline" icon={Calendar}>
                        <div className="space-y-3">
                            {[
                                { label: 'Account Created', value: fmtDateTime(userData.created_at), icon: Calendar },
                                { label: 'Last Updated',    value: fmtDateTime(userData.updated_at),  icon: Clock },
                                { label: 'Last Login',      value: fmtDateTime(userData.last_login),  icon: Key },
                            ].map(item => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon className="size-3.5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{item.label}</p>
                                            <p className="text-xs text-foreground font-medium mt-0.5">{item.value}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
        </TooltipProvider>
    );
}
