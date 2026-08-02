"use client"

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Search, Pencil, RefreshCcw, Users, Eye, CheckCircle2, XCircle, Crown, RotateCcw, Loader2 } from 'lucide-react';
import { getAllUsers } from '@/(api-handlers)/userHandler';
import { resendAdminVerification } from '@/(api-handlers)/organizationHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatsGrid from '@/components/(shared-components)/StatsGrid';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { useKeyedCooldown, formatCooldown } from '@/hooks/useCooldown';

const ITEMS_PER_PAGE = 10;
const RESEND_VERIFICATION_COOLDOWN_SECONDS = 120;

type Role = 'all' | 'superadmin' | 'admin' | 'manager' | 'attendant';
type Status = 'all' | 'active' | 'inactive';

const ROLE_BADGE: Record<string, string> = {
    superadmin: 'border-primary/30 bg-primary/10 text-primary',
    admin:      'border-info/30 bg-info/10 text-info',
    manager:    'border-success/30 bg-success/10 text-success',
    attendant:  'border-border bg-muted text-muted-foreground',
};

const ROLE_AVATAR: Record<string, string> = {
    superadmin: 'bg-primary/10 text-primary',
    admin:      'bg-info/10 text-info',
    manager:    'bg-success/10 text-success',
    attendant:  'bg-muted text-muted-foreground',
};

function getInitials(first: string, last: string) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function fmtDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SuperAdminPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role>('all');
    const [statusFilter, setStatusFilter] = useState<Status>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [cooldowns, startCooldown] = useKeyedCooldown();

    const handleResendAdminVerification = async (u: UserResponse) => {
        if (!u.organization) return;
        setResendingId(u.id);
        try {
            const res = await resendAdminVerification(u.organization.id);
            toast.success(res.message);
            startCooldown(u.id, RESEND_VERIFICATION_COOLDOWN_SECONDS);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                startCooldown(u.id, RESEND_VERIFICATION_COOLDOWN_SECONDS);
            }
            handleErrorMessage(error, 'Failed to resend verification email');
        } finally {
            setResendingId(null);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            setUsers(await getAllUsers());
        } catch {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchText, roleFilter, statusFilter]);

    const stats = useMemo(() => ({
        total:      users.length,
        active:     users.filter(u => u.is_active).length,
        superadmin: users.filter(u => u.role === 'superadmin').length,
        admin:      users.filter(u => u.role === 'admin').length,
        manager:    users.filter(u => u.role === 'manager').length,
        attendant:  users.filter(u => u.role === 'attendant').length,
    }), [users]);

    const filtered = useMemo(() => users.filter(u => {
        const q = searchText.toLowerCase();
        const matchSearch = `${u.first_name} ${u.last_name} ${u.email} ${u.username}`.toLowerCase().includes(q);
        const matchRole   = roleFilter === 'all' || u.role === roleFilter;
        const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
        return matchSearch && matchRole && matchStatus;
    }), [users, searchText, roleFilter, statusFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const currentUsers = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const roles: { key: Role; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'superadmin', label: 'Super Admin' },
        { key: 'admin', label: 'Admin' },
        { key: 'manager', label: 'Manager' },
        { key: 'attendant', label: 'Attendant' },
    ];

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-6">
            <PageHeader
                title="User Management"
                description="Manage and monitor all platform users in one place."
                actions={
                    <Button variant="outline" size="icon" className="size-9" onClick={fetchUsers} disabled={loading} aria-label="Refresh users">
                        <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                }
            />

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <StatsGrid
                columns={6}
                stats={[
                    { name: 'Total', value: stats.total, change: 'users', changeType: 'neutral' },
                    { name: 'Active', value: stats.active, change: `${stats.total - stats.active} inactive`, changeType: 'neutral' },
                    { name: 'Super Admin', value: stats.superadmin },
                    { name: 'Admin', value: stats.admin },
                    { name: 'Manager', value: stats.manager },
                    { name: 'Attendant', value: stats.attendant },
                ]}
            />

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-48 flex-1 max-w-sm">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search by name, email or username…"
                        className="h-9 pl-9 bg-background"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>

                {/* Role filter */}
                <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5 flex-wrap">
                    {roles.map(r => (
                        <button
                            key={r.key}
                            onClick={() => setRoleFilter(r.key)}
                            className={cn(
                                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                                roleFilter === r.key
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {/* Status filter */}
                <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                    {(['all', 'active', 'inactive'] as Status[]).map(s => (
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

                {(searchText || roleFilter !== 'all' || statusFilter !== 'all') && (
                    <span className="text-muted-foreground text-xs">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6 w-[220px]">User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="pr-6 w-[140px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Users className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No users found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {searchText ? 'Try a different search term.' : 'No users exist in the system.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : currentUsers.map(u => (
                                <TableRow key={u.id}>
                                    {/* Identity */}
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-9 shrink-0 rounded-lg">
                                                <AvatarImage src={u.profile_pic ?? undefined} alt={`${u.first_name} ${u.last_name}`} className="object-cover" />
                                                <AvatarFallback className={cn("rounded-lg text-xs font-bold", ROLE_AVATAR[u.role] ?? 'bg-muted text-muted-foreground')}>
                                                    {getInitials(u.first_name, u.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate font-semibold text-sm leading-tight">
                                                    {u.first_name} {u.last_name}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Role */}
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('capitalize rounded-full text-xs font-medium', ROLE_BADGE[u.role] ?? 'border-border bg-muted text-muted-foreground')}
                                        >
                                            {u.role === 'superadmin' && <Crown className="mr-1 size-3" />}
                                            {u.role}
                                        </Badge>
                                    </TableCell>

                                    {/* Organization */}
                                    <TableCell className="text-muted-foreground text-xs">
                                        {u.organization?.name ?? '—'}
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        {u.is_active ? (
                                            <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                                                <CheckCircle2 className="size-3.5" /> Active
                                            </span>
                                        ) : (
                                            <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                                                <XCircle className="size-3.5" /> Inactive
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Verified */}
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs rounded-full font-medium",
                                                u.email_verified
                                                    ? "border-success/30 bg-success/10 text-success"
                                                    : "border-warning/30 bg-warning/10 text-warning-foreground"
                                            )}
                                        >
                                            {u.email_verified ? 'Verified' : 'Pending'}
                                        </Badge>
                                    </TableCell>

                                    {/* Last Login */}
                                    <TableCell className="text-muted-foreground text-xs">
                                        {fmtDate(u.last_login)}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-1.5" asChild>
                                                <Link href={`/users/${u.id}`}><Eye className="size-3.5" /> View</Link>
                                            </Button>
                                            {u.role?.toLowerCase() === 'admin' && !u.email_verified && u.organization && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost" size="icon" className="size-8"
                                                            aria-label="Resend verification email"
                                                            disabled={resendingId === u.id || (cooldowns[u.id] ?? 0) > 0}
                                                            onClick={() => handleResendAdminVerification(u)}
                                                        >
                                                            {resendingId === u.id
                                                                ? <Loader2 className="size-4 animate-spin" />
                                                                : <RotateCcw className="size-4" />}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {(cooldowns[u.id] ?? 0) > 0
                                                            ? `Resend in ${formatCooldown(cooldowns[u.id])}`
                                                            : 'Resend verification email'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            {u.employee_profile && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Edit employee profile">
                                                            <Link href={`/users/edit-employee-profile/${u.id}`}><Pencil className="size-4" /></Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit employee profile</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
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
        </div>
        </TooltipProvider>
    );
}
