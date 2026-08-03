"use client"

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ArrowLeft, Building2, Mail, Phone, MapPin, Calendar,
    CheckCircle2, XCircle, Globe, FileText, LayoutDashboard,
    UserCog, Loader2, RotateCcw, CreditCard, AlertTriangle, Ban, Power,
} from 'lucide-react';
import { getOrganizationProfileByOrgId } from '@/(api-handlers)/organizationProfileHandler';
import {
    resendAdminVerification, changeOrganizationSubscriptionPlan,
    deactivateOrganizationAccount, reactivateOrganizationAccount,
} from '@/(api-handlers)/organizationHandler';
import { OrganizationResponse } from '@/interfaces/organization';
import EmptyState from '@/components/(shared-components)/EmptyState';
import StatsGrid from '@/components/(shared-components)/StatsGrid';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { useCooldown, formatCooldown } from '@/hooks/useCooldown';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
    BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const RESEND_ADMIN_VERIFICATION_COOLDOWN_SECONDS = 120;

interface OrgDetailsPageProps {
    params: Promise<{ id: string }>;
}

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtDate(iso?: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isOrgExpired(org: OrganizationResponse) {
    return org.subscription_expires_at !== null && new Date(org.subscription_expires_at) < new Date();
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

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-5 w-40 rounded" />
            <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full shrink-0" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-56" />
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
        </div>
    );
}

export default function OrganizationDetailsPage({ params }: OrgDetailsPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [org, setOrg] = useState<OrganizationResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useCooldown();
    const [reactivating, setReactivating] = useState(false);
    const [togglingAccount, setTogglingAccount] = useState(false);
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getOrganizationProfileByOrgId(Number(id));
                setOrg(data);
            } catch (error) {
                handleErrorMessage(error, 'Failed to fetch organization details');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const admin = org?.admin ?? null;

    const handleResendAdminVerification = async () => {
        if (resendCooldown > 0) return;
        setResending(true);
        try {
            const res = await resendAdminVerification(Number(id));
            toast.success(res.message);
            setResendCooldown(RESEND_ADMIN_VERIFICATION_COOLDOWN_SECONDS);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setResendCooldown(RESEND_ADMIN_VERIFICATION_COOLDOWN_SECONDS);
            }
            handleErrorMessage(error, 'Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    const handleReactivate = async () => {
        if (!org?.subscription_plan) return;
        setReactivating(true);
        try {
            const data = await changeOrganizationSubscriptionPlan(Number(id), org.subscription_plan.id);
            setOrg(data);
            toast.success(`${data.name}'s subscription has been renewed`);
        } catch (error) {
            handleErrorMessage(error, 'Failed to reactivate organization');
        } finally {
            setReactivating(false);
        }
    };

    const handleDeactivateAccount = async () => {
        setTogglingAccount(true);
        try {
            const data = await deactivateOrganizationAccount(Number(id));
            setOrg(data);
            toast.success(`${data.name}'s account has been suspended`);
            setIsDeactivateOpen(false);
        } catch (error) {
            handleErrorMessage(error, 'Failed to deactivate organization');
        } finally {
            setTogglingAccount(false);
        }
    };

    const handleReactivateAccount = async () => {
        setTogglingAccount(true);
        try {
            const data = await reactivateOrganizationAccount(Number(id));
            setOrg(data);
            toast.success(`${data.name}'s account has been reactivated`);
        } catch (error) {
            handleErrorMessage(error, 'Failed to reactivate organization account');
        } finally {
            setTogglingAccount(false);
        }
    };

    if (loading) return <LoadingSkeleton />;

    if (!org) {
        return (
            <div className="flex items-center justify-center py-24">
                <EmptyState
                    title="Organization Not Found"
                    description="This organization does not exist or has been removed."
                    actions={
                        <Button variant="outline" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="size-4" /> Go Back
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
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
                            <Link href="/organizations">Organizations</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="truncate max-w-[200px]">{org.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    {org.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={org.logo_url}
                            alt={`${org.name} logo`}
                            className="size-16 shrink-0 rounded-full border border-border object-contain bg-muted"
                        />
                    ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                            {getInitials(org.name) || <Building2 className="size-7" />}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-foreground leading-tight">{org.name}</h1>
                            <Badge variant="outline" className="rounded-full text-xs font-semibold gap-1 border-border bg-muted text-muted-foreground">
                                {org.subscription_plan?.name ?? 'No Plan'}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn("rounded-full text-xs font-semibold",
                                    org.is_active
                                        ? "border-success/30 bg-success/10 text-success"
                                        : "border-destructive/30 bg-destructive/10 text-destructive"
                                )}
                            >
                                {org.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {isOrgExpired(org) && (
                                <Badge variant="outline" className="rounded-full text-xs font-semibold gap-1 border-destructive/30 bg-destructive/10 text-destructive">
                                    <AlertTriangle className="size-3" /> Expired
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm font-medium mt-1">{org.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isOrgExpired(org) && (
                        <Button
                            size="sm" className="gap-2"
                            disabled={reactivating}
                            onClick={handleReactivate}
                        >
                            <RotateCcw className={cn("size-4", reactivating && "animate-spin")} />
                            {reactivating ? 'Reactivating…' : 'Reactivate'}
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" /> Back
                    </Button>
                </div>
            </div>

            {/* ── Quick stats ─────────────────────────────────────────────────── */}
            <StatsGrid
                stats={[
                    { name: 'Max Shops', value: org.max_shops },
                    { name: 'Max Users', value: org.max_users },
                    { name: 'Currency', value: org.currency },
                    { name: 'Joined', value: fmtDate(org.created_at) },
                ]}
            />

            {/* ── Main grid ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="gap-0 p-0">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Mail className="size-4 text-muted-foreground" />
                                Contact & Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4">
                            <InfoItem icon={Mail} label="Email Address" value={org.email} />
                            <InfoItem icon={Phone} label="Phone Number" value={org.phone_number} />
                            <InfoItem icon={MapPin} label="Address" value={org.address} />
                            <InfoItem icon={FileText} label="Description" value={org.description} />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-6">
                    <Card className="gap-0 p-0">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <UserCog className="size-4 text-muted-foreground" />
                                Administrator
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4 space-y-3">
                            {admin ? (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {admin.first_name} {admin.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Email Verified</span>
                                        {admin.email_verified ? (
                                            <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                                                <CheckCircle2 className="size-3.5" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-warning-foreground text-xs font-semibold">
                                                <XCircle className="size-3.5" /> Unverified
                                            </span>
                                        )}
                                    </div>
                                    {!admin.email_verified && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2"
                                            disabled={resending || resendCooldown > 0}
                                            onClick={handleResendAdminVerification}
                                        >
                                            {resending
                                                ? <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                                                : resendCooldown > 0
                                                ? `Resend in ${formatCooldown(resendCooldown)}`
                                                : <><RotateCcw className="size-3.5" /> Resend verification email</>
                                            }
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground">No admin user found for this organization.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-0 p-0">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <CreditCard className="size-4 text-muted-foreground" />
                                Subscription
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Plan</span>
                                <span className="font-semibold text-foreground text-sm">{org.subscription_plan?.name ?? 'No Plan'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Expires</span>
                                {isOrgExpired(org) ? (
                                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-semibold">
                                        <AlertTriangle className="size-3.5" /> {fmtDate(org.subscription_expires_at)}
                                    </span>
                                ) : (
                                    <span className="font-semibold text-foreground text-sm">
                                        {org.subscription_expires_at ? fmtDate(org.subscription_expires_at) : 'Never'}
                                    </span>
                                )}
                            </div>
                            {isOrgExpired(org) && (
                                <Button
                                    variant="outline" size="sm" className="w-full gap-2"
                                    disabled={reactivating}
                                    onClick={handleReactivate}
                                >
                                    <RotateCcw className={cn("size-3.5", reactivating && "animate-spin")} />
                                    {reactivating ? 'Reactivating…' : 'Reactivate subscription'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-0 p-0">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="size-4 text-muted-foreground" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Account Status</span>
                                {org.is_active ? (
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
                                <span className="text-muted-foreground text-xs">Created</span>
                                <span className="inline-flex items-center gap-1 text-foreground text-xs font-medium">
                                    <Calendar className="size-3.5" /> {fmtDate(org.created_at)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Last Updated</span>
                                <span className="inline-flex items-center gap-1 text-foreground text-xs font-medium">
                                    <Calendar className="size-3.5" /> {fmtDate(org.updated_at)}
                                </span>
                            </div>
                            {org.is_active ? (
                                <Button
                                    variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive"
                                    disabled={togglingAccount}
                                    onClick={() => setIsDeactivateOpen(true)}
                                >
                                    <Ban className="size-3.5" /> Deactivate account
                                </Button>
                            ) : (
                                <Button
                                    variant="outline" size="sm" className="w-full gap-2"
                                    disabled={togglingAccount}
                                    onClick={handleReactivateAccount}
                                >
                                    <Power className={cn("size-3.5", togglingAccount && "animate-spin")} />
                                    {togglingAccount ? 'Reactivating…' : 'Reactivate account'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Deactivate Account Confirmation */}
            <AlertDialog open={isDeactivateOpen} onOpenChange={open => !open && setIsDeactivateOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Organization Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to suspend <strong>{org.name}</strong>? This immediately blocks all
                            non-superadmin users of this organization from signing in, regardless of their subscription
                            status. It does not change their plan or expiry — reverse it any time with Reactivate Account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeactivateAccount}
                            disabled={togglingAccount}
                        >
                            {togglingAccount ? 'Deactivating…' : 'Deactivate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
