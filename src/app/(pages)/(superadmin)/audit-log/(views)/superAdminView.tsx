"use client";

import { useCallback, useEffect, useState } from 'react';
import {
    Eye, RefreshCcw, Search, FilterX, ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import { AuditLogResponse } from '@/interfaces/auditLog';
import { getAllAuditLogs } from '@/(api-handlers)/auditLogHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    if (action.includes('delete')) return 'border-destructive/30 bg-destructive/10 text-destructive';
    if (action.includes('update') || action.includes('edit')) return 'border-warning/30 bg-warning/10 text-warning-foreground';
    if (action.includes('create')) return 'border-success/30 bg-success/10 text-success';
    return 'border-info/30 bg-info/10 text-info';
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

    const [actionFilter, setActionFilter]     = useState('');
    const [entityType, setEntityType]         = useState('');
    const [entityId, setEntityId]             = useState('');
    const [pendingFilters, setPendingFilters] = useState({ action: '', entityType: '', entityId: '' });

    const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchLogs = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await getAllAuditLogs(
                undefined, undefined,
                actionFilter || undefined,
                entityType || undefined,
                entityId || undefined,
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
        setActionFilter(pendingFilters.action);
        setEntityType(pendingFilters.entityType);
        setEntityId(pendingFilters.entityId);
        setPage(1);
    };

    const resetFilters = () => {
        setPendingFilters({ action: '', entityType: '', entityId: '' });
        setActionFilter('');
        setEntityType('');
        setEntityId('');
        setPage(1);
    };

    const hasFilters = actionFilter !== '' || entityType !== '' || entityId !== '';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Audit Logs"
                description="Track and monitor system-wide actions and security events."
                actions={
                    <Button variant="outline" size="icon" onClick={() => fetchLogs(page)} disabled={loading}>
                        <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                    </Button>
                }
            />

            {/* Filters */}
            <Card className="gap-0 p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[180px] flex-1 space-y-1.5">
                        <Label className="text-xs">Action</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                            <Input
                                className="h-9 pl-8 text-sm"
                                placeholder="e.g. create_user"
                                value={pendingFilters.action}
                                onChange={e => setPendingFilters(p => ({ ...p, action: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="min-w-[160px] flex-1 space-y-1.5">
                        <Label className="text-xs">Entity type</Label>
                        <Input
                            className="h-9 text-sm"
                            placeholder="e.g. Organization"
                            value={pendingFilters.entityType}
                            onChange={e => setPendingFilters(p => ({ ...p, entityType: e.target.value }))}
                        />
                    </div>
                    <div className="min-w-[120px] flex-1 space-y-1.5">
                        <Label className="text-xs">Entity ID</Label>
                        <Input
                            className="h-9 text-sm"
                            placeholder="Enter ID"
                            value={pendingFilters.entityId}
                            onChange={e => setPendingFilters(p => ({ ...p, entityId: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-2">
                        {hasFilters && (
                            <Button variant="outline" size="sm" className="h-9" onClick={resetFilters}>
                                <FilterX className="mr-1.5 size-3.5" /> Reset
                            </Button>
                        )}
                        <Button size="sm" className="h-9" onClick={applyFilters}>
                            Apply filters
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">IP Address</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="pr-6 text-right">Details</TableHead>
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
                                        <p className="text-muted-foreground text-sm">No audit logs found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : auditLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="pl-6">
                                        <p className="text-foreground text-sm font-semibold">{log.user_email}</p>
                                        <p className="text-muted-foreground text-xs capitalize">{log.user_role}</p>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('rounded-full text-xs font-medium capitalize', actionBadgeClass(log.action))}
                                        >
                                            {log.action.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <p className="text-foreground text-sm font-medium">{log.entity_type}</p>
                                        <p className="text-muted-foreground font-mono text-[10px]">ID {log.entity_id}</p>
                                    </TableCell>

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

                                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                                        {log.ip_address}
                                    </TableCell>

                                    <TableCell>
                                        <p className="text-foreground text-xs font-medium">
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-muted-foreground text-[10px]">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </p>
                                    </TableCell>

                                    <TableCell className="pr-6 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <Eye className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && auditLogs.length > 0 && (
                    <div className="border-border bg-muted/30 border-t px-6 py-3 text-xs">
                        <span className="text-muted-foreground">{total.toLocaleString()} total logs</span>
                    </div>
                )}
            </Card>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={total} />

            {/* Details modal */}
            <Dialog open={!!selectedLog} onOpenChange={open => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-5 pt-1">
                            <div className="bg-info/10 border-info/20 grid grid-cols-2 gap-4 rounded-xl border p-4">
                                <div>
                                    <p className="text-info text-xs font-medium">User</p>
                                    <p className="text-foreground text-sm font-semibold">{selectedLog.user_email}</p>
                                    <p className="text-muted-foreground text-xs">{selectedLog.user_role} · {selectedLog.ip_address}</p>
                                </div>
                                <div>
                                    <p className="text-info text-xs font-medium">Action & time</p>
                                    <p className="text-foreground text-sm font-semibold capitalize">{selectedLog.action.replace(/_/g, ' ')}</p>
                                    <p className="text-muted-foreground text-xs">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="border-border space-y-1 rounded-lg border p-3">
                                <p className="text-muted-foreground text-xs font-medium">Entity</p>
                                <p className="text-foreground text-sm">{selectedLog.entity_type} <span className="text-muted-foreground font-mono text-xs">(ID: {selectedLog.entity_id})</span></p>
                            </div>

                            {selectedLog.error_message && (
                                <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
                                    <p className="text-destructive text-xs font-medium">Error message</p>
                                    <p className="text-destructive text-sm">{selectedLog.error_message}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <JsonBlock title="Old values" data={selectedLog.old_values} />
                                <JsonBlock title="New values" data={selectedLog.new_values} />
                            </div>
                            <JsonBlock title="Full changes" data={selectedLog.changes} />

                            <div className="border-border border-t pt-3">
                                <p className="text-muted-foreground text-[10px]">User agent: {selectedLog.user_agent}</p>
                                <p className="text-muted-foreground text-[10px]">Location: {selectedLog.location || 'Unknown'}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
