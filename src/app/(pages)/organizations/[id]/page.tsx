"use client"

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Building2, Mail, Phone, MapPin, Calendar,
    CheckCircle2, XCircle, BadgeCheck, Globe, FileText, LayoutDashboard,
} from 'lucide-react';
import { getOrganizationProfileByOrgId } from '@/(api-handlers)/organizationProfileHandler';
import { OrganizationResponse } from '@/interfaces/organization';
import EmptyState from '@/components/(shared-components)/EmptyState';
import StatsGrid from '@/components/(shared-components)/StatsGrid';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
    BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from '@/lib/utils';

interface OrgDetailsPageProps {
    params: Promise<{ id: string }>;
}

const PLAN_BADGE: Record<string, string> = {
    free:         'border-border bg-muted text-muted-foreground',
    basic:        'border-info/30 bg-info/10 text-info',
    pro:          'border-primary/30 bg-primary/10 text-primary',
    enterprise:   'border-warning/30 bg-warning/10 text-warning-foreground',
};

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtDate(iso?: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                        {getInitials(org.name) || <Building2 className="size-7" />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-foreground leading-tight">{org.name}</h1>
                            <Badge variant="outline" className={cn("capitalize rounded-full text-xs font-semibold gap-1", PLAN_BADGE[org.plan_type] ?? 'border-border bg-muted text-muted-foreground')}>
                                {org.plan_type === 'enterprise' && <BadgeCheck className="size-3" />}
                                {org.plan_type}
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
                        </div>
                        <p className="text-muted-foreground text-sm font-medium mt-1">{org.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
