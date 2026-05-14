'use client'

import { useState, useEffect, useMemo } from "react";
import { OrganizationResponse } from "@/interfaces/organization";
import {
    getAllOrganizations, changeOrganizationPlanType, deleteOrganization,
} from "@/(api-handlers)/organizationHandler";
import PageHeader from "@/components/(shared-components)/PageHeader";
import Pagination from "@/components/(shared-components)/Pagination";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search, Plus, MoreHorizontal, Pencil, Trash2, Building2, RefreshCcw,
    CheckCircle2, XCircle, Users, Store, BadgeCheck, Phone, Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const PLAN_BADGE: Record<string, string> = {
    free:         'border-border bg-muted text-muted-foreground',
    basic:        'border-info/30 bg-info/10 text-info',
    pro:          'border-primary/30 bg-primary/10 text-primary',
    enterprise:   'border-warning/30 bg-warning/10 text-warning-foreground',
    starter:      'border-border bg-muted text-muted-foreground',
    professional: 'border-info/30 bg-info/10 text-info',
};

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function StatChip({ label, value, sub }: { label: string; value: number; sub?: string }) {
    return (
        <Card className="p-0">
            <CardContent className="px-5 py-4">
                <p className="text-muted-foreground text-xs font-medium">{label}</p>
                <p className="text-foreground text-2xl font-bold mt-0.5">{value}</p>
                {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

type StatusFilter = 'all' | 'active' | 'inactive';

export default function OrganizationsPage() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedOrg, setSelectedOrg] = useState<OrganizationResponse | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
    const [newPlan, setNewPlan] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            setOrganizations(await getAllOrganizations());
        } catch {
            toast.error('Failed to fetch organizations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrganizations(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter, planFilter]);

    const stats = useMemo(() => {
        const active     = organizations.filter(o => o.is_active).length;
        const enterprise = organizations.filter(o => o.plan_type === 'enterprise').length;
        const pro        = organizations.filter(o => o.plan_type === 'pro').length;
        return { total: organizations.length, active, inactive: organizations.length - active, enterprise, pro };
    }, [organizations]);

    const planTypes = useMemo(() => (
        [...new Set(organizations.map(o => o.plan_type))].sort()
    ), [organizations]);

    const filtered = useMemo(() => organizations.filter(org => {
        const matchSearch = `${org.name} ${org.email} ${org.phone_number}`.toLowerCase().includes(searchText.toLowerCase());
        const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? org.is_active : !org.is_active);
        const matchPlan   = planFilter === 'all' || org.plan_type === planFilter;
        return matchSearch && matchStatus && matchPlan;
    }), [organizations, searchText, statusFilter, planFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const current = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDelete = async () => {
        if (!selectedOrg) return;
        setActionLoading(true);
        try {
            await deleteOrganization(selectedOrg.id);
            toast.success('Organization deleted successfully');
            fetchOrganizations();
            setIsDeleteOpen(false);
        } catch {
            toast.error('Failed to delete organization');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePlan = async () => {
        if (!selectedOrg || !newPlan) return;
        setActionLoading(true);
        try {
            await changeOrganizationPlanType(selectedOrg.id, newPlan);
            toast.success(`Plan changed to ${newPlan} successfully`);
            fetchOrganizations();
            setIsChangePlanOpen(false);
        } catch {
            toast.error('Failed to change plan');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Organizations"
                description="Manage and monitor all platform organizations in one place."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="size-9" onClick={fetchOrganizations} disabled={loading} aria-label="Refresh organizations">
                            <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                        </Button>
                        <Button onClick={() => router.push('/organizations/create')}>
                            <Plus className="mr-2 size-4" /> Add Organization
                        </Button>
                    </div>
                }
            />

            {/* ── Summary stat chips ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatChip label="Total" value={stats.total} sub="organizations" />
                <StatChip label="Active" value={stats.active} sub={`${stats.inactive} inactive`} />
                <StatChip label="Pro" value={stats.pro} sub="on pro plan" />
                <StatChip label="Enterprise" value={stats.enterprise} sub="on enterprise plan" />
            </div>

            {/* ── Filters toolbar ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-48 flex-1 max-w-sm">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search organizations…"
                        className="h-9 pl-9 bg-background"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>

                <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                    {(['all', 'active', 'inactive'] as StatusFilter[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                                statusFilter === s
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="h-9 w-36 bg-background text-xs">
                        <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All plans</SelectItem>
                        {planTypes.map(p => (
                            <SelectItem key={p} value={p} className="capitalize">
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(searchText || statusFilter !== 'all' || planFilter !== 'all') && (
                    <span className="text-muted-foreground text-xs">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Table ───────────────────────────────────────────────────────── */}
            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6 w-[260px]">Organization</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="pr-6 w-[60px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : current.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Building2 className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No organizations found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {searchText ? 'Try a different search term.' : 'Create your first organization to get started.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : current.map(org => (
                                <TableRow key={org.id}>
                                    {/* Identity */}
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                                                {getInitials(org.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate font-semibold text-sm leading-tight">{org.name}</p>
                                                {org.description && (
                                                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{org.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    {/* Contact */}
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                                <Mail className="size-3 shrink-0" /> {org.email}
                                            </span>
                                            {org.phone_number && (
                                                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                                    <Phone className="size-3 shrink-0" /> {org.phone_number}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {/* Plan */}
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn("capitalize rounded-full text-xs font-medium", PLAN_BADGE[org.plan_type] ?? 'border-border bg-muted text-muted-foreground')}
                                        >
                                            {org.plan_type === 'enterprise' && <BadgeCheck className="mr-1 size-3" />}
                                            {org.plan_type}
                                        </Badge>
                                    </TableCell>
                                    {/* Capacity */}
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                                <Store className="size-3 shrink-0" /> {org.max_shops} shops
                                            </span>
                                            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                                <Users className="size-3 shrink-0" /> {org.max_users} users
                                            </span>
                                        </div>
                                    </TableCell>
                                    {/* Status */}
                                    <TableCell>
                                        {org.is_active ? (
                                            <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                                                <CheckCircle2 className="size-3.5" /> Active
                                            </span>
                                        ) : (
                                            <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                                                <XCircle className="size-3.5" /> Inactive
                                            </span>
                                        )}
                                    </TableCell>
                                    {/* Joined */}
                                    <TableCell className="text-muted-foreground text-xs">
                                        {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    {/* Actions */}
                                    <TableCell className="pr-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8" aria-label="Organization actions">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedOrg(org);
                                                    setNewPlan(org.plan_type);
                                                    setIsChangePlanOpen(true);
                                                }}>
                                                    <Pencil className="mr-2 size-4" /> Change Plan
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => { setSelectedOrg(org); setIsDeleteOpen(true); }}
                                                >
                                                    <Trash2 className="mr-2 size-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && filtered.length > ITEMS_PER_PAGE && (
                    <div className="border-border border-t px-6 py-3">
                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            total={filtered.length}
                            isLoading={loading}
                        />
                    </div>
                )}
            </Card>

            {/* Change Plan Dialog */}
            <Dialog open={isChangePlanOpen} onOpenChange={open => !open && setIsChangePlanOpen(false)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Change Organization Plan</DialogTitle>
                        <DialogDescription>
                            Select a new plan for <strong>{selectedOrg?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label>New Plan</Label>
                        <Select value={newPlan} onValueChange={setNewPlan}>
                            <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangePlanOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangePlan} disabled={actionLoading || !newPlan}>
                            {actionLoading ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={open => !open && setIsDeleteOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedOrg?.name}</strong>?
                            This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
