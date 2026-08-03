"use client"

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/(zustand-store)/authStore';
import {
    getShifts, createShift, updateShift, deleteShift, getOvertimeSummary,
} from '@/(api-handlers)/schedulingHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { getOrganizationUsers } from '@/(api-handlers)/userHandler';
import { Shift, ShiftStatus, OvertimeSummary } from '@/interfaces/scheduling';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { UserResponse } from '@/interfaces/loginInterface';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import EmptyState from '@/components/(shared-components)/EmptyState';
import StatsGrid from '@/components/(shared-components)/StatsGrid';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    CalendarClock, Timer, Plus, Pencil, Trash2, RefreshCcw,
    Clock, CheckCircle2, XCircle, AlertTriangle, Calculator, List, LayoutGrid,
} from 'lucide-react';
import { DatePicker, TimePicker, Calendar } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;
const MAX_VISIBLE_CHIPS = 3;
const MONTH_FETCH_LIMIT = 200;

function getInitials(first?: string, last?: string) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

const SHIFT_STATUS_CONFIG: Record<ShiftStatus, { label: string; cls: string; icon: React.ElementType }> = {
    scheduled: { label: 'Scheduled', cls: 'border-info/30 bg-info/10 text-info', icon: Clock },
    completed: { label: 'Completed', cls: 'border-success/30 bg-success/10 text-success', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
    no_show: { label: 'No Show', cls: 'border-warning/30 bg-warning/10 text-warning-foreground', icon: AlertTriangle },
};

function ShiftStatusBadge({ status }: { status: ShiftStatus }) {
    const cfg = SHIFT_STATUS_CONFIG[status] ?? SHIFT_STATUS_CONFIG.scheduled;
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={cn('rounded-full text-xs', cfg.cls)}>
            <Icon className="mr-1 size-3" /> {cfg.label}
        </Badge>
    );
}

export default function SchedulingPage() {
    const { user } = useAuthStore();
    const role = user?.role;
    const isPrivileged = role === 'admin' || role === 'manager' || role === 'superadmin';
    const employeeProfileId = user?.employee_profile?.id;

    if (!user) {
        return (
            <div className="flex items-center justify-center py-24">
                <Skeleton className="size-6 rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Scheduling"
                description="Manage shift schedules and track overtime."
            />

            <Tabs defaultValue="shifts" className="w-full">
                <TabsList>
                    <TabsTrigger value="shifts"><CalendarClock className="mr-1.5 size-4" /> Shifts</TabsTrigger>
                    <TabsTrigger value="overtime"><Timer className="mr-1.5 size-4" /> Overtime Summary</TabsTrigger>
                </TabsList>
                <TabsContent value="shifts">
                    <ShiftsTab isPrivileged={isPrivileged} />
                </TabsContent>
                <TabsContent value="overtime">
                    <OvertimeSummaryTab isPrivileged={isPrivileged} employeeProfileId={employeeProfileId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─── Shifts ──────────────────────────────────────────────────────────────────
function ShiftsTab({ isPrivileged }: { isPrivileged: boolean }) {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');

    const [shifts, setShifts] = useState<Shift[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [visibleMonth, setVisibleMonth] = useState(dayjs());
    const [monthShifts, setMonthShifts] = useState<Shift[]>([]);
    const [monthLoading, setMonthLoading] = useState(true);

    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [shopFilter, setShopFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Shift | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<{
        shopId: string; employeeId: string; date: Dayjs | null;
        startTime: Dayjs | null; endTime: Dayjs | null; status: ShiftStatus; notes: string;
    }>({ shopId: '', employeeId: '', date: null, startTime: null, endTime: null, status: 'scheduled', notes: '' });

    const shopById = useMemo(() => new Map(shops.map(s => [s.id, s])), [shops]);
    const userByProfileId = useMemo(() => {
        const map = new Map<number, UserResponse>();
        users.forEach(u => { if (u.employee_profile) map.set(u.employee_profile.id, u); });
        return map;
    }, [users]);

    useEffect(() => {
        getOrganizationShops().then(setShops).catch(err => handleErrorMessage(err, 'Failed to load shops'));
        getOrganizationUsers().then(setUsers).catch(err => handleErrorMessage(err, 'Failed to load employees'));
    }, []);

    const fetchShifts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getShifts({
                shop_id: shopFilter === 'all' ? undefined : Number(shopFilter),
                employee_profile_id: isPrivileged && employeeFilter !== 'all' ? Number(employeeFilter) : undefined,
                status: statusFilter === 'all' ? undefined : (statusFilter as ShiftStatus),
                skip: (currentPage - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
            });
            setShifts(res.items);
            setTotal(res.total);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load shifts');
        } finally {
            setLoading(false);
        }
    }, [shopFilter, employeeFilter, statusFilter, currentPage, isPrivileged]);

    useEffect(() => { if (view === 'list') fetchShifts(); }, [view, fetchShifts]);
    useEffect(() => { setCurrentPage(1); }, [shopFilter, employeeFilter, statusFilter]);

    const fetchMonthShifts = useCallback(async () => {
        setMonthLoading(true);
        try {
            const start_date = visibleMonth.startOf('month').format('YYYY-MM-DD');
            const end_date = visibleMonth.endOf('month').format('YYYY-MM-DD');
            const filters = {
                shop_id: shopFilter === 'all' ? undefined : Number(shopFilter),
                employee_profile_id: isPrivileged && employeeFilter !== 'all' ? Number(employeeFilter) : undefined,
                status: statusFilter === 'all' ? undefined : (statusFilter as ShiftStatus),
                start_date, end_date,
            };
            const all: Shift[] = [];
            let skip = 0;
            for (let page = 0; page < 20; page++) {
                const res = await getShifts({ ...filters, skip, limit: MONTH_FETCH_LIMIT });
                all.push(...res.items);
                skip += res.items.length;
                if (res.items.length === 0 || all.length >= res.total) break;
            }
            setMonthShifts(all);
        } catch (err) {
            handleErrorMessage(err, 'Failed to load shifts');
        } finally {
            setMonthLoading(false);
        }
    }, [visibleMonth, shopFilter, employeeFilter, statusFilter, isPrivileged]);

    useEffect(() => { if (view === 'calendar') fetchMonthShifts(); }, [view, fetchMonthShifts]);

    const openDialog = (row: Shift | null = null, presetDate?: Dayjs) => {
        setEditing(row);
        setForm(row
            ? {
                shopId: String(row.shop_id), employeeId: String(row.employee_profile_id),
                date: dayjs(row.shift_date), startTime: dayjs(row.start_time, 'HH:mm:ss'), endTime: dayjs(row.end_time, 'HH:mm:ss'),
                status: row.status, notes: row.notes ?? '',
            }
            : { shopId: '', employeeId: '', date: presetDate ?? null, startTime: null, endTime: null, status: 'scheduled', notes: '' }
        );
        setIsDialogOpen(true);
    };
    const closeDialog = () => { setIsDialogOpen(false); setEditing(null); };

    const refresh = () => { if (view === 'calendar') fetchMonthShifts(); else fetchShifts(); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.shopId || !form.employeeId || !form.date || !form.startTime || !form.endTime) {
            toast.error('Fill in shop, employee, date, and times');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                shop_id: Number(form.shopId),
                employee_profile_id: Number(form.employeeId),
                shift_date: form.date.format('YYYY-MM-DD'),
                start_time: form.startTime.format('HH:mm:ss'),
                end_time: form.endTime.format('HH:mm:ss'),
                notes: form.notes || undefined,
            };
            if (editing) {
                await updateShift(editing.id, { ...payload, status: form.status });
                toast.success('Shift updated');
            } else {
                await createShift(payload);
                toast.success('Shift created');
            }
            closeDialog();
            refresh();
        } catch (err) {
            handleErrorMessage(err, editing ? 'Failed to update shift' : 'Failed to create shift');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteShift(deleteTarget.id);
            toast.success('Shift deleted');
            refresh();
        } catch (err) {
            handleErrorMessage(err, 'Failed to delete shift');
        } finally {
            setDeleteTarget(null);
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={shopFilter} onValueChange={setShopFilter}>
                        <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Shops" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shops</SelectItem>
                            {shops.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {isPrivileged && (
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
                    )}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="size-9" onClick={refresh} disabled={loading || monthLoading} aria-label="Refresh shifts">
                        <RefreshCcw className={cn('size-4', (loading || monthLoading) && 'animate-spin')} />
                    </Button>
                    <div className="border-border flex items-center rounded-md border p-0.5">
                        <Button
                            variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm"
                            className="h-8 gap-1.5 px-2.5"
                            onClick={() => setView('calendar')}
                        >
                            <LayoutGrid className="size-3.5" /> Calendar
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'} size="sm"
                            className="h-8 gap-1.5 px-2.5"
                            onClick={() => setView('list')}
                        >
                            <List className="size-3.5" /> List
                        </Button>
                    </div>
                </div>
                {isPrivileged && (
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 size-4" /> Add Shift
                    </Button>
                )}
            </div>

            {view === 'calendar' ? (
                <Card className="gap-0 overflow-hidden p-2">
                    {monthLoading && monthShifts.length === 0 ? (
                        <Skeleton className="h-[520px] w-full rounded-lg" />
                    ) : (
                        <Calendar
                            value={visibleMonth}
                            onPanelChange={date => setVisibleMonth(date)}
                            cellRender={(date, info) => {
                                if (info.type !== 'date') return null;
                                const dateStr = date.format('YYYY-MM-DD');
                                const dayShifts = monthShifts.filter(s => s.shift_date === dateStr);
                                const visible = dayShifts.slice(0, MAX_VISIBLE_CHIPS);
                                const extra = dayShifts.length - visible.length;
                                return (
                                    <div className="group/day flex h-full min-h-[76px] flex-col gap-0.5 overflow-hidden py-0.5">
                                        {visible.map(shift => {
                                            const emp = userByProfileId.get(shift.employee_profile_id);
                                            const cfg = SHIFT_STATUS_CONFIG[shift.status] ?? SHIFT_STATUS_CONFIG.scheduled;
                                            const label = `${shift.start_time.slice(0, 5)} ${emp ? getInitials(emp.first_name, emp.last_name) : `#${shift.employee_profile_id}`}`;
                                            return (
                                                <button
                                                    key={shift.id}
                                                    type="button"
                                                    disabled={!isPrivileged}
                                                    onClick={e => { e.stopPropagation(); if (isPrivileged) openDialog(shift); }}
                                                    title={`${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)} · ${emp ? `${emp.first_name} ${emp.last_name}` : `#${shift.employee_profile_id}`} · ${shopById.get(shift.shop_id)?.name ?? ''}`}
                                                    className={cn(
                                                        'w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight',
                                                        cfg.cls,
                                                        isPrivileged ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
                                                    )}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                        {extra > 0 && (
                                            <span className="text-muted-foreground px-1 text-[10px]">+{extra} more</span>
                                        )}
                                        {isPrivileged && (
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); openDialog(null, date); }}
                                                className="text-muted-foreground hover:bg-muted hover:text-foreground mt-auto hidden shrink-0 items-center justify-center rounded py-0.5 text-[10px] group-hover/day:flex"
                                            >
                                                + Add
                                            </button>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    )}
                </Card>
            ) : (
            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Employee</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Status</TableHead>
                                {isPrivileged && <TableHead className="pr-6 w-[100px] text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: isPrivileged ? 7 : 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : shifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isPrivileged ? 7 : 6} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <CalendarClock className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No shifts found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {isPrivileged ? 'Add a shift to build the schedule.' : 'You have no scheduled shifts yet.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : shifts.map(shift => {
                                const emp = userByProfileId.get(shift.employee_profile_id);
                                return (
                                    <TableRow key={shift.id}>
                                        <TableCell className="pl-6">
                                            {emp ? (
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-8 shrink-0 rounded-lg">
                                                        <AvatarImage src={emp.profile_pic ?? undefined} alt={`${emp.first_name} ${emp.last_name}`} className="object-cover" />
                                                        <AvatarFallback className="rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                                                            {getInitials(emp.first_name, emp.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="text-foreground text-sm font-medium">{emp.first_name} {emp.last_name}</p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">#{shift.employee_profile_id}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">{shopById.get(shift.shop_id)?.name ?? `#${shift.shop_id}`}</TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(shift.shift_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-sm">{shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}</TableCell>
                                        <TableCell className="num-tabular text-sm">{shift.scheduled_hours}</TableCell>
                                        <TableCell><ShiftStatusBadge status={shift.status} /></TableCell>
                                        {isPrivileged && (
                                            <TableCell className="pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openDialog(shift)} aria-label="Edit shift">
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8"
                                                        onClick={() => setDeleteTarget(shift)}
                                                        aria-label="Delete shift"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
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
            )}

            <Dialog open={isDialogOpen} onOpenChange={open => !open && closeDialog()}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Shift' : 'Add Shift'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Shop</Label>
                                <Select value={form.shopId} onValueChange={v => setForm(f => ({ ...f, shopId: v }))}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select shop" /></SelectTrigger>
                                    <SelectContent>
                                        {shops.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Employee</Label>
                                <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
                                    <SelectContent>
                                        {users.filter(u => !!u.employee_profile).map(u => (
                                            <SelectItem key={u.employee_profile!.id} value={String(u.employee_profile!.id)}>
                                                {u.first_name} {u.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <DatePicker className="w-full" value={form.date} onChange={date => setForm(f => ({ ...f, date }))} format="DD MMM YYYY" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Start Time</Label>
                                <TimePicker className="w-full" value={form.startTime} onChange={t => setForm(f => ({ ...f, startTime: t }))} format="HH:mm" minuteStep={15} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Time</Label>
                                <TimePicker className="w-full" value={form.endTime} onChange={t => setForm(f => ({ ...f, endTime: t }))} format="HH:mm" minuteStep={15} />
                            </div>
                        </div>
                        {editing && (
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ShiftStatus }))}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="no_show">No Show</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="min-h-[60px] resize-none" />
                        </div>
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
                        <AlertDialogTitle>Delete Shift</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete this shift on {deleteTarget && new Date(deleteTarget.shift_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}? This cannot be undone.
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

// ─── Overtime Summary ────────────────────────────────────────────────────────
function OvertimeSummaryTab({ isPrivileged, employeeProfileId }: { isPrivileged: boolean; employeeProfileId?: number }) {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [employeeId, setEmployeeId] = useState(employeeProfileId ? String(employeeProfileId) : '');
    const [range, setRange] = useState<[Dayjs, Dayjs] | null>([dayjs().startOf('month'), dayjs()]);
    const [summary, setSummary] = useState<OvertimeSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isPrivileged) {
            getOrganizationUsers().then(setUsers).catch(err => handleErrorMessage(err, 'Failed to load employees'));
        }
    }, [isPrivileged]);

    const handleCalculate = async () => {
        if (!employeeId || !range) { toast.error('Pick an employee and date range'); return; }
        setLoading(true);
        try {
            const data = await getOvertimeSummary(Number(employeeId), range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD'));
            setSummary(data);
        } catch (err) {
            handleErrorMessage(err, 'Failed to calculate overtime summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
                {isPrivileged ? (
                    <div className="space-y-1.5">
                        <Label className="text-xs">Employee</Label>
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                            <SelectContent>
                                {users.filter(u => !!u.employee_profile).map(u => (
                                    <SelectItem key={u.employee_profile!.id} value={String(u.employee_profile!.id)}>
                                        {u.first_name} {u.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}
                <div className="space-y-1.5">
                    <Label className="text-xs">Date Range</Label>
                    <DatePicker.RangePicker
                        value={range}
                        onChange={dates => setRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
                        format="DD MMM YYYY"
                    />
                </div>
                <Button onClick={handleCalculate} disabled={loading || !employeeId}>
                    <Calculator className="mr-2 size-4" /> {loading ? 'Calculating…' : 'Calculate'}
                </Button>
            </div>

            {!employeeId ? (
                <EmptyState
                    title="Select an employee"
                    description="Choose an employee and date range, then calculate their overtime summary."
                    icon={Timer}
                />
            ) : summary ? (
                <StatsGrid
                    columns={3}
                    stats={[
                        { name: 'Regular Hours', value: summary.regular_hours },
                        { name: 'Overtime Hours', value: summary.overtime_hours },
                        { name: 'Total Hours', value: summary.total_hours },
                    ]}
                />
            ) : (
                <EmptyState
                    title="No summary yet"
                    description="Click Calculate to see regular vs. overtime hours for the selected range."
                    icon={Timer}
                />
            )}
        </div>
    );
}
