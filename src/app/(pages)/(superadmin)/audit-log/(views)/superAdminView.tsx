"use client";

import { useCallback, useEffect, useState } from 'react';
import {
    Eye, RefreshCcw, Search, FilterX, ShieldAlert, User, Clock, Globe,
} from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { AuditLogResponse } from '@/interfaces/auditLog';
import { getAllAuditLogs } from '@/(api-handlers)/auditLogHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

function actionBadgeClass(action: string) {
    if (action.includes('delete'))                        return 'border-destructive/30 bg-destructive/10 text-destructive';
    if (action.includes('update') || action.includes('edit')) return 'border-warning/30 bg-warning/10 text-warning-foreground';
    if (action.includes('create'))                        return 'border-success/30 bg-success/10 text-success';
    return 'border-info/30 bg-info/10 text-info';
}

function getInitials(email: string) {
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
}

function fmtDate(iso: string) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
    if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) return null;
    return (
        <div>
            <p className="text-muted-foreground mb-1.5 text-xs font-semibold uppercase tracking-wider">{title}</p>
            <pre className="bg-muted border-border overflow-x-auto rounded-md border p-3 text-xs">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

export default function SuperAdminView() {
    const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
    const [loading, setLoading]     = useState(true);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);

    const [actionFilter, setActionFilter] = useState('');
    const [entityType, setEntityType]     = useState('');
    const [entityId, setEntityId]         = useState('');
    const [pending, setPending] = useState({ action: '', entityType: '', entityId: '' });

    const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const hasFilters = actionFilter !== '' || entityType !== '' || entityId !== '';

    const fetchLogs = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await getAllAuditLogs(
                undefined, undefined,
                actionFilter || undefined,
                entityType   || undefined,
                entityId     || undefined,
                PAGE_SIZE,
                (p - 1) * PAGE_SIZE,
            );
            setAuditLogs(data.items);
            setTotal(data.total);
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    }, [actionFilter, entityType, entityId]);

    useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

    const applyFilters = () => {
        setActionFilter(pending.action);
        setEntityType(pending.entityType);
        setEntityId(pending.entityId);
        setPage(1);
    };

    const resetFilters = () => {
        setPending({ action: '', entityType: '', entityId: '' });
        setActionFilter('');
        setEntityType('');
        setEntityId('');
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Audit Logs"
                description="Track and monitor system-wide actions and security events."
                actions={
                    <Button variant="outline" size="icon" className="size-9" onClick={() => fetchLogs(page)} disabled={loading} aria-label="Refresh logs">
                        <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                    </Button>
                }
            />

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <Card className="gap-0 p-0">
                <CardContent className="px-5 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[180px] flex-1 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</p>
                            <div className="relative">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                                <Input
                                    className="h-9 pl-8 bg-background text-sm"
                                    placeholder="e.g. create_user"
                                    value={pending.action}
                                    onChange={e => setPending(p => ({ ...p, action: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                />
                            </div>
                        </div>
                        <div className="min-w-[160px] flex-1 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entity Type</p>
                            <Input
                                className="h-9 bg-background text-sm"
                                placeholder="e.g. Organization"
                                value={pending.entityType}
                                onChange={e => setPending(p => ({ ...p, entityType: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            />
                        </div>
                        <div className="min-w-[120px] w-36 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entity ID</p>
                            <Input
                                className="h-9 bg-background text-sm"
                                placeholder="Enter ID"
                                value={pending.entityId}
                                onChange={e => setPending(p => ({ ...p, entityId: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            />
                        </div>
                        <div className="flex gap-2 pb-0.5">
                            {hasFilters && (
                                <Button variant="outline" size="sm" className="h-9" onClick={resetFilters}>
                                    <FilterX className="mr-1.5 size-3.5" /> Reset
                                </Button>
                            )}
                            <Button size="sm" className="h-9 px-5" onClick={applyFilters}>
                                Apply
                            </Button>
                        </div>
                    </div>
                    {hasFilters && (
                        <p className="text-xs text-muted-foreground mt-3">
                            Showing {total.toLocaleString()} filtered result{total !== 1 ? 's' : ''}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6 w-[200px]">User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">IP</TableHead>
                                <TableHead>When</TableHead>
                                <TableHead className="pr-6 text-right w-[60px]">View</TableHead>
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
                            ) : auditLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <ShieldAlert className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No audit logs found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {hasFilters ? 'Try adjusting your filters.' : 'Activity will appear here once actions are performed.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : auditLogs.map(log => {
                                const { date, time } = fmtDate(log.created_at);
                                return (
                                    <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                                        {/* User */}
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                                                    {getInitials(log.user_email)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-xs font-semibold">{log.user_email}</p>
                                                    <p className="text-muted-foreground capitalize text-[10px]">{log.user_role}</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn('rounded-full text-xs font-medium capitalize whitespace-nowrap', actionBadgeClass(log.action))}
                                            >
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>

                                        {/* Entity */}
                                        <TableCell>
                                            <p className="text-foreground text-sm font-medium">{log.entity_type}</p>
                                            <p className="text-muted-foreground font-mono text-[10px]">#{log.entity_id}</p>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'rounded-full text-xs font-medium',
                                                    log.status === 'success'
                                                        ? 'border-success/30 bg-success/10 text-success'
                                                        : 'border-destructive/30 bg-destructive/10 text-destructive',
                                                )}
                                            >
                                                {log.status}
                                            </Badge>
                                        </TableCell>

                                        {/* IP */}
                                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                                            {log.ip_address || '—'}
                                        </TableCell>

                                        {/* When */}
                                        <TableCell>
                                            <p className="text-foreground text-xs font-medium">{date}</p>
                                            <p className="text-muted-foreground text-[10px]">{time}</p>
                                        </TableCell>

                                        {/* View */}
                                        <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedLog(log)} aria-label="View log details">
                                                <Eye className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {!loading && total > 0 && (
                    <div className="border-border bg-muted/30 border-t px-6 py-3 flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">{total.toLocaleString()} total log entries</span>
                    </div>
                )}
            </Card>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={total} />

            {/* ── Detail dialog ─────────────────────────────────────────────── */}
            <Dialog open={!!selectedLog} onOpenChange={open => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="size-4 text-muted-foreground" />
                            Audit Log Detail
                        </DialogTitle>
                    </DialogHeader>
                    {selectedLog && (() => {
                        const { date, time } = fmtDate(selectedLog.created_at);
                        return (
                            <div className="space-y-5 pt-1">
                                {/* Summary grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                            <User className="size-3" /> User
                                        </p>
                                        <p className="text-foreground text-sm font-semibold">{selectedLog.user_email}</p>
                                        <p className="text-muted-foreground text-xs capitalize">{selectedLog.user_role}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                            <Clock className="size-3" /> Timestamp
                                        </p>
                                        <p className="text-foreground text-sm font-semibold">{date}</p>
                                        <p className="text-muted-foreground text-xs">{time}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Action</p>
                                        <Badge variant="outline" className={cn('rounded-full text-xs font-medium capitalize mt-1', actionBadgeClass(selectedLog.action))}>
                                            {selectedLog.action.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                            <Globe className="size-3" /> Network
                                        </p>
                                        <p className="text-foreground text-sm font-mono">{selectedLog.ip_address || '—'}</p>
                                        <p className="text-muted-foreground text-xs">{selectedLog.location || 'Unknown location'}</p>
                                    </div>
                                </div>

                                {/* Entity */}
                                <div className="border-border rounded-lg border p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium">Entity</p>
                                        <p className="text-foreground text-sm font-semibold mt-0.5">{selectedLog.entity_type}</p>
                                    </div>
                                    <p className="text-muted-foreground font-mono text-xs">ID: {selectedLog.entity_id}</p>
                                </div>

                                {/* Status + error */}
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn('rounded-full text-xs font-medium', selectedLog.status === 'success'
                                            ? 'border-success/30 bg-success/10 text-success'
                                            : 'border-destructive/30 bg-destructive/10 text-destructive')}
                                    >
                                        {selectedLog.status}
                                    </Badge>
                                </div>

                                {selectedLog.error_message && (
                                    <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
                                        <p className="text-destructive text-xs font-medium mb-0.5">Error</p>
                                        <p className="text-destructive text-sm">{selectedLog.error_message}</p>
                                    </div>
                                )}

                                {/* Change payloads */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <JsonBlock title="Old Values" data={selectedLog.old_values} />
                                    <JsonBlock title="New Values" data={selectedLog.new_values} />
                                </div>
                                <JsonBlock title="Full Changes" data={selectedLog.changes} />

                                {selectedLog.user_agent && (
                                    <div className="border-border border-t pt-3">
                                        <p className="text-muted-foreground text-[10px] break-all">
                                            <span className="font-medium">User Agent: </span>{selectedLog.user_agent}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
