"use client"

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/(zustand-store)/authStore';
import {
    getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
    getLeaveBalances, upsertLeaveBalance,
    getLeaveRequests, createLeaveRequest, approveLeaveRequest, cancelLeaveRequest,
} from '@/(api-handlers)/leaveHandler';
import { getOrganizationUsers } from '@/(api-handlers)/userHandler';
import { LeaveType, LeaveBalance, LeaveRequest, LeaveRequestStatus } from '@/interfaces/leave';
import { UserResponse } from '@/interfaces/loginInterface';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    CalendarDays, ListChecks, Wallet, Tag, Plus, Pencil, Trash2,
    Search, X, Check, Clock, CheckCircle2, XCircle, UsersRound,
} from 'lucide-react';
import { DatePicker } from 'antd';
import { type Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

function formatDateRange(start: string, end: string) {
    const s = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const e = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return start === end ? e : `${s} – ${e}`;
}

const REQUEST_STATUS_CONFIG: Record<LeaveRequestStatus, { label: string; cls: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', cls: 'border-warning/30 bg-warning/10 text-warning-foreground', icon: Clock },
    approved: { label: 'Approved', cls: 'border-success/30 bg-success/10 text-success', icon: CheckCircle2 },
    rejected: { label: 'Rejected', cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
};

function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
    const cfg = REQUEST_STATUS_CONFIG[status] ?? REQUEST_STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={cn('rounded-full text-xs', cfg.cls)}>
            <Icon className="mr-1 size-3" /> {cfg.label}
        </Badge>
    );
}

export default function LeavePage() {
    const { user } = useAuthStore();
    const role = user?.role;
    const isPrivileged = role === 'admin' || role === 'manager' || role === 'superadmin';
    const canManageTypes = role === 'admin' || role === 'superadmin';
    const canManageBalances = role === 'admin' || role === 'manager';
    const employeeProfileId = user?.employee_profile?.id;

    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [typesLoading, setTypesLoading] = useState(true);

    const fetchLeaveTypes = useCallback(async () => {
        setTypesLoading(true);
        try {
            const data = await getLeaveTypes();
            setLeaveTypes(data);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load leave types');
        } finally {
            setTypesLoading(false);
        }
    }, []);

    useEffect(() => { if (user) fetchLeaveTypes(); }, [user, fetchLeaveTypes]);

    if (!user) {
        return (
            <div className="flex items-center justify-center py-24">
                <Skeleton className="size-6 rounded-full" />
            </div>
        );
    }

    const defaultTab = employeeProfileId ? 'my' : isPrivileged ? 'approvals' : 'my';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Leave & HR"
                description="Request time off, track balances, and manage approvals."
            />

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList>
                    {employeeProfileId && (
                        <TabsTrigger value="my"><CalendarDays className="mr-1.5 size-4" /> My Requests</TabsTrigger>
                    )}
                    {isPrivileged && (
                        <TabsTrigger value="approvals"><ListChecks className="mr-1.5 size-4" /> Approvals</TabsTrigger>
                    )}
                    {canManageBalances && (
                        <TabsTrigger value="balances"><Wallet className="mr-1.5 size-4" /> Balances</TabsTrigger>
                    )}
                    {canManageTypes && (
                        <TabsTrigger value="types"><Tag className="mr-1.5 size-4" /> Leave Types</TabsTrigger>
                    )}
                </TabsList>

                {employeeProfileId && (
                    <TabsContent value="my">
                        <MyRequestsTab employeeProfileId={employeeProfileId} leaveTypes={leaveTypes} />
                    </TabsContent>
                )}
                {isPrivileged && (
                    <TabsContent value="approvals">
                        <ApprovalsTab leaveTypes={leaveTypes} />
                    </TabsContent>
                )}
                {canManageBalances && (
                    <TabsContent value="balances">
                        <BalancesTab leaveTypes={leaveTypes} />
                    </TabsContent>
                )}
                {canManageTypes && (
                    <TabsContent value="types">
                        <LeaveTypesTab leaveTypes={leaveTypes} typesLoading={typesLoading} onChanged={fetchLeaveTypes} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

// ─── My Requests ─────────────────────────────────────────────────────────────
function MyRequestsTab({ employeeProfileId, leaveTypes }: { employeeProfileId: number; leaveTypes: LeaveType[] }) {
    const currentYear = new Date().getFullYear();
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [balancesLoading, setBalancesLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<{ leaveTypeId: string; range: [Dayjs, Dayjs] | null; reason: string; notes: string }>({
        leaveTypeId: '', range: null, reason: '', notes: '',
    });
    const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const typeById = useMemo(() => new Map(leaveTypes.map(t => [t.id, t])), [leaveTypes]);
    const activeTypes = leaveTypes.filter(t => t.is_active);

    const fetchBalances = useCallback(async () => {
        setBalancesLoading(true);
        try {
            const data = await getLeaveBalances(employeeProfileId, currentYear);
            setBalances(data);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load leave balances');
        } finally {
            setBalancesLoading(false);
        }
    }, [employeeProfileId, currentYear]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getLeaveRequests({
                employee_profile_id: employeeProfileId,
                skip: (currentPage - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
            });
            setRequests(res.items);
            setTotal(res.total);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    }, [employeeProfileId, currentPage]);

    useEffect(() => { fetchBalances(); }, [fetchBalances]);
    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.leaveTypeId || !form.range) { toast.error('Pick a leave type and date range'); return; }
        setSubmitting(true);
        try {
            await createLeaveRequest({
                leave_type_id: Number(form.leaveTypeId),
                start_date: form.range[0].format('YYYY-MM-DD'),
                end_date: form.range[1].format('YYYY-MM-DD'),
                reason: form.reason || undefined,
                notes: form.notes || undefined,
            });
            toast.success('Leave request submitted');
            setIsDialogOpen(false);
            setForm({ leaveTypeId: '', range: null, reason: '', notes: '' });
            fetchRequests();
            fetchBalances();
        } catch (err) {
            handleErrorMessage(err, 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await cancelLeaveRequest(cancelTarget.id);
            toast.success('Leave request cancelled');
            fetchRequests();
        } catch (err) {
            handleErrorMessage(err, 'Failed to cancel leave request');
        } finally {
            setCancelling(false);
            setCancelTarget(null);
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="mt-6 flex flex-col gap-4">
            {balancesLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
            ) : balances.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {balances.map(b => {
                        const t = typeById.get(b.leave_type_id);
                        return (
                            <Card key={b.id} className="p-4">
                                <p className="text-muted-foreground truncate text-xs font-medium">{t?.name ?? `Type #${b.leave_type_id}`}</p>
                                <p className="text-foreground mt-1 text-xl font-bold">
                                    {b.remaining_days}
                                    <span className="text-muted-foreground text-sm font-normal"> / {b.allocated_days} days</span>
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">{b.used_days} used this year</p>
                            </Card>
                        );
                    })}
                </div>
            ) : null}

            <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-semibold">My Leave Requests</p>
                <Button onClick={() => setIsDialogOpen(true)} disabled={activeTypes.length === 0}>
                    <Plus className="mr-2 size-4" /> Request Leave
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Leave #</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <CalendarDays className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No leave requests yet</p>
                                        <p className="text-muted-foreground mt-1 text-sm">Submit a request when you need time off.</p>
                                    </TableCell>
                                </TableRow>
                            ) : requests.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell className="pl-6 font-mono text-sm">{r.leave_number}</TableCell>
                                    <TableCell className="text-sm">{typeById.get(r.leave_type_id)?.name ?? `Type #${r.leave_type_id}`}</TableCell>
                                    <TableCell className="text-sm">{formatDateRange(r.start_date, r.end_date)}</TableCell>
                                    <TableCell className="text-sm">{r.total_days}</TableCell>
                                    <TableCell><LeaveStatusBadge status={r.status} /></TableCell>
                                    <TableCell className="pr-6 text-right">
                                        {r.status === 'pending' && (
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8"
                                                onClick={() => setCancelTarget(r)}
                                                aria-label="Cancel request"
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && total > ITEMS_PER_PAGE && (
                    <div className="border-border border-t px-6 py-3">
                        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} total={total} isLoading={loading} />
                    </div>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={open => !open && setIsDialogOpen(false)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                        <div className="space-y-1.5">
                            <Label>Leave Type</Label>
                            <Select value={form.leaveTypeId} onValueChange={v => setForm(f => ({ ...f, leaveTypeId: v }))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a leave type" /></SelectTrigger>
                                <SelectContent>
                                    {activeTypes.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Dates</Label>
                            <DatePicker.RangePicker
                                className="w-full"
                                value={form.range}
                                onChange={dates => setForm(f => ({ ...f, range: dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null }))}
                                format="DD MMM YYYY"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={form.reason}
                                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                placeholder="e.g. Family event"
                                className="min-h-[70px] resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="min-h-[60px] resize-none"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cancel <strong>{cancelTarget?.leave_number}</strong>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Request</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelling…' : 'Cancel Request'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Approvals ────────────────────────────────────────────────────────────────
function ApprovalsTab({ leaveTypes }: { leaveTypes: LeaveType[] }) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
    const [approving, setApproving] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const typeById = useMemo(() => new Map(leaveTypes.map(t => [t.id, t])), [leaveTypes]);
    const userByProfileId = useMemo(() => {
        const map = new Map<number, UserResponse>();
        users.forEach(u => { if (u.employee_profile) map.set(u.employee_profile.id, u); });
        return map;
    }, [users]);

    useEffect(() => {
        getOrganizationUsers().then(setUsers).catch(err => handleErrorMessage(err, 'Failed to load employees'));
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getLeaveRequests({
                status: statusFilter === 'all' ? undefined : (statusFilter as LeaveRequestStatus),
                employee_profile_id: employeeFilter === 'all' ? undefined : Number(employeeFilter),
                leave_type_id: typeFilter === 'all' ? undefined : Number(typeFilter),
                skip: (currentPage - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
            });
            setRequests(res.items);
            setTotal(res.total);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, employeeFilter, typeFilter, currentPage]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, employeeFilter, typeFilter]);

    const handleApprove = async () => {
        if (!approveTarget) return;
        setApproving(true);
        try {
            await approveLeaveRequest(approveTarget.id, { approved: true });
            toast.success('Leave request approved');
            fetchRequests();
        } catch (err) {
            handleErrorMessage(err, 'Failed to approve leave request');
        } finally {
            setApproving(false);
            setApproveTarget(null);
        }
    };

    const openReject = (r: LeaveRequest) => { setRejectTarget(r); setRejectReason(''); };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectTarget) return;
        setRejecting(true);
        try {
            await approveLeaveRequest(rejectTarget.id, { approved: false, rejection_reason: rejectReason || undefined });
            toast.success('Leave request rejected');
            setRejectTarget(null);
            fetchRequests();
        } catch (err) {
            handleErrorMessage(err, 'Failed to reject leave request');
        } finally {
            setRejecting(false);
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {users.filter(u => !!u.employee_profile).map(u => (
                            <SelectItem key={u.employee_profile!.id} value={String(u.employee_profile!.id)}>
                                {u.first_name} {u.last_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {leaveTypes.map(t => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Leave #</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 w-[140px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <ListChecks className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No leave requests found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">Try adjusting the filters above.</p>
                                    </TableCell>
                                </TableRow>
                            ) : requests.map(r => {
                                const emp = userByProfileId.get(r.employee_profile_id);
                                return (
                                    <TableRow key={r.id}>
                                        <TableCell className="pl-6 font-mono text-sm">{r.leave_number}</TableCell>
                                        <TableCell className="text-sm">{emp ? `${emp.first_name} ${emp.last_name}` : `#${r.employee_profile_id}`}</TableCell>
                                        <TableCell className="text-sm">{typeById.get(r.leave_type_id)?.name ?? `#${r.leave_type_id}`}</TableCell>
                                        <TableCell className="text-sm">{formatDateRange(r.start_date, r.end_date)}</TableCell>
                                        <TableCell className="text-sm">{r.total_days}</TableCell>
                                        <TableCell><LeaveStatusBadge status={r.status} /></TableCell>
                                        <TableCell className="pr-6 text-right">
                                            {r.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="text-success hover:text-success hover:bg-success/10 size-8"
                                                        onClick={() => setApproveTarget(r)}
                                                        aria-label="Approve request"
                                                    >
                                                        <Check className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8"
                                                        onClick={() => openReject(r)}
                                                        aria-label="Reject request"
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {!loading && total > ITEMS_PER_PAGE && (
                    <div className="border-border border-t px-6 py-3">
                        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} total={total} isLoading={loading} />
                    </div>
                )}
            </Card>

            <AlertDialog open={!!approveTarget} onOpenChange={open => !open && setApproveTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Approve <strong>{approveTarget?.leave_number}</strong> for {approveTarget?.total_days} day(s)?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} disabled={approving}>
                            {approving ? 'Approving…' : 'Approve'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!rejectTarget} onOpenChange={open => !open && setRejectTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Reject Leave Request</DialogTitle></DialogHeader>
                    <form onSubmit={handleReject} className="space-y-5 pt-2">
                        <div className="space-y-1.5">
                            <Label>Rejection Reason</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Explain why this request is being rejected"
                                className="min-h-[80px] resize-none"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setRejectTarget(null)}>Cancel</Button>
                            <Button type="submit" variant="destructive" disabled={rejecting}>
                                {rejecting ? 'Rejecting…' : 'Reject Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Leave Types ─────────────────────────────────────────────────────────────
function LeaveTypesTab({
    leaveTypes, typesLoading, onChanged,
}: {
    leaveTypes: LeaveType[];
    typesLoading: boolean;
    onChanged: () => void;
}) {
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<LeaveType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', default_days_per_year: 0, requires_approval: true, is_paid: true, is_active: true,
    });

    const filtered = leaveTypes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    const openDialog = (row: LeaveType | null = null) => {
        setEditing(row);
        setForm(row
            ? {
                name: row.name, description: row.description ?? '', default_days_per_year: row.default_days_per_year,
                requires_approval: row.requires_approval, is_paid: row.is_paid, is_active: row.is_active,
            }
            : { name: '', description: '', default_days_per_year: 0, requires_approval: true, is_paid: true, is_active: true }
        );
        setIsDialogOpen(true);
    };
    const closeDialog = () => { setIsDialogOpen(false); setEditing(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editing) {
                await updateLeaveType(editing.id, form);
                toast.success('Leave type updated');
            } else {
                await createLeaveType(form);
                toast.success('Leave type created');
            }
            closeDialog();
            onChanged();
        } catch (err) {
            handleErrorMessage(err, editing ? 'Failed to update leave type' : 'Failed to create leave type');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteLeaveType(deleteTarget.id);
            toast.success('Leave type deleted');
            onChanged();
        } catch (err) {
            handleErrorMessage(err, 'Failed to delete leave type');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input placeholder="Search leave types…" className="h-9 pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button onClick={() => openDialog()}>
                    <Plus className="mr-2 size-4" /> Add Leave Type
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Name</TableHead>
                                <TableHead>Days / Year</TableHead>
                                <TableHead>Approval</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="pr-6 w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {typesLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Tag className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No leave types yet</p>
                                        <p className="text-muted-foreground mt-1 text-sm">Add one to let employees start requesting time off.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="pl-6">
                                        <p className="text-foreground text-sm font-semibold">{t.name}</p>
                                        {t.description && <p className="text-muted-foreground text-xs">{t.description}</p>}
                                    </TableCell>
                                    <TableCell className="text-sm">{t.default_days_per_year}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-full text-xs">
                                            {t.requires_approval ? 'Required' : 'Auto-approved'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{t.is_paid ? 'Paid' : 'Unpaid'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('rounded-full text-xs', t.is_active ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-muted text-muted-foreground')}>
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openDialog(t)} aria-label="Edit leave type">
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8"
                                                onClick={() => setDeleteTarget(t)}
                                                aria-label="Delete leave type"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={open => !open && closeDialog()}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                        <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Leave" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description (optional)</Label>
                            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[60px] resize-none" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Default Days / Year</Label>
                            <Input
                                type="number" min={0} step="0.5"
                                value={form.default_days_per_year}
                                onChange={e => setForm(f => ({ ...f, default_days_per_year: Number(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-foreground text-sm font-medium">Requires Approval</p>
                                <p className="text-muted-foreground text-xs">If off, requests auto-approve on submission.</p>
                            </div>
                            <Switch checked={form.requires_approval} onCheckedChange={v => setForm(f => ({ ...f, requires_approval: v }))} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <p className="text-foreground text-sm font-medium">Paid Leave</p>
                            <Switch checked={form.is_paid} onCheckedChange={v => setForm(f => ({ ...f, is_paid: v }))} />
                        </div>
                        {editing && (
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <p className="text-foreground text-sm font-medium">Active</p>
                                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeDialog}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete <strong>{deleteTarget?.name}</strong>? Existing requests and balances referencing it may be affected. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Balances ────────────────────────────────────────────────────────────────
function BalancesTab({ leaveTypes }: { leaveTypes: LeaveType[] }) {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [employeeId, setEmployeeId] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(false);

    const [editTarget, setEditTarget] = useState<{ typeId: number; typeName: string } | null>(null);
    const [allocatedDays, setAllocatedDays] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getOrganizationUsers().then(setUsers).catch(err => handleErrorMessage(err, 'Failed to load employees'));
    }, []);

    const employees = users.filter(u => !!u.employee_profile);

    const fetchBalances = useCallback(async () => {
        if (!employeeId) { setBalances([]); return; }
        setLoading(true);
        try {
            const data = await getLeaveBalances(Number(employeeId), year);
            setBalances(data);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load leave balances');
        } finally {
            setLoading(false);
        }
    }, [employeeId, year]);

    useEffect(() => { fetchBalances(); }, [fetchBalances]);

    const balanceByType = useMemo(() => new Map(balances.map(b => [b.leave_type_id, b])), [balances]);

    const openEdit = (type: LeaveType) => {
        const existing = balanceByType.get(type.id);
        setEditTarget({ typeId: type.id, typeName: type.name });
        setAllocatedDays(existing?.allocated_days ?? type.default_days_per_year);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget || !employeeId) return;
        setSaving(true);
        try {
            await upsertLeaveBalance(Number(employeeId), editTarget.typeId, { year, allocated_days: allocatedDays });
            toast.success('Balance updated');
            setEditTarget(null);
            fetchBalances();
        } catch (err) {
            handleErrorMessage(err, 'Failed to update balance');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                    <SelectContent>
                        {employees.map(u => (
                            <SelectItem key={u.employee_profile!.id} value={String(u.employee_profile!.id)}>
                                {u.first_name} {u.last_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input type="number" className="w-[110px]" value={year} onChange={e => setYear(Number(e.target.value))} />
            </div>

            {!employeeId ? (
                <EmptyState
                    title="Select an employee"
                    description="Pick an employee above to view and edit their leave balances."
                    icon={UsersRound}
                />
            ) : (
                <Card className="gap-0 overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Leave Type</TableHead>
                                    <TableHead>Allocated</TableHead>
                                    <TableHead>Used</TableHead>
                                    <TableHead>Remaining</TableHead>
                                    <TableHead className="pr-6 w-[90px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : leaveTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground py-16 text-center text-sm">
                                            No leave types configured yet.
                                        </TableCell>
                                    </TableRow>
                                ) : leaveTypes.map(t => {
                                    const b = balanceByType.get(t.id);
                                    return (
                                        <TableRow key={t.id}>
                                            <TableCell className="pl-6 text-sm font-medium">{t.name}</TableCell>
                                            <TableCell className="text-sm">{b?.allocated_days ?? 0}</TableCell>
                                            <TableCell className="text-sm">{b?.used_days ?? 0}</TableCell>
                                            <TableCell className="text-sm">{b?.remaining_days ?? 0}</TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(t)} aria-label="Edit allocation">
                                                    <Pencil className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Edit Allocation — {editTarget?.typeName}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSave} className="space-y-5 pt-2">
                        <div className="space-y-1.5">
                            <Label>Allocated Days ({year})</Label>
                            <Input type="number" min={0} step="0.5" value={allocatedDays} onChange={e => setAllocatedDays(Number(e.target.value))} required />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
