'use client'

import { useState, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Building2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const PLAN_COLORS: Record<string, string> = {
    free:       'border-border bg-muted text-muted-foreground',
    basic:      'border-primary/20 bg-primary/10 text-primary',
    pro:        'border-info/30 bg-info/10 text-info',
    enterprise: 'border-warning/30 bg-warning/10 text-warning-foreground',
    starter:    'border-border bg-muted text-muted-foreground',
    professional: 'border-info/30 bg-info/10 text-info',
};

export default function OrganizationsPage() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
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
    useEffect(() => { setCurrentPage(1); }, [searchText]);

    const filtered = organizations.filter(org =>
        `${org.name} ${org.email} ${org.phone_number}`
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

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

            <div className="relative max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                    placeholder="Search organizations…"
                    className="h-9 pl-9"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Shops / Users</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="pr-6 w-[60px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : current.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-20 text-center">
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
                                    <TableCell className="pl-6 font-semibold">{org.name}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs line-clamp-1 text-sm">
                                        {org.description || '—'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{org.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn("capitalize rounded-full text-xs", PLAN_COLORS[org.plan_type] ?? 'border-border bg-muted text-muted-foreground')}
                                        >
                                            {org.plan_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {org.max_shops} shops / {org.max_users} users
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-full text-xs",
                                                org.is_active
                                                    ? "border-success/30 bg-success/10 text-success"
                                                    : "border-destructive/30 bg-destructive/10 text-destructive"
                                            )}
                                        >
                                            {org.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </TableCell>
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
