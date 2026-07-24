"use client"

import { useCallback, useEffect, useState } from 'react';
import { Eye, Filter, Plus, ReceiptText, RefreshCcw, ShoppingBag, User } from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import EmptyState from '@/components/(shared-components)/EmptyState';
import { StatusPill } from '@/components/(shared-components)/StatusPill';
import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog';
import ExpenseDetailDialog from '@/components/expenses/ExpenseDetailDialog';
import { GetExpenseCategories, GetExpenses } from '@/(api-handlers)/expensesHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { ExpenseCategoryResponse, ExpenseResponse, ExpenseStatus } from '@/interfaces/expenses';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

export default function ExpensesPage() {
    const fmt = useCurrency();
    const { user } = useAuthStore();

    const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>('all');
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState('all');
    const [onlyMine, setOnlyMine] = useState(false);

    const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ExpenseResponse | null>(null);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const categoryName = (id: number) => categories.find((c) => c.id === id)?.name || `Category #${id}`;

    useEffect(() => {
        getOrganizationShops().then(setShops).catch(console.error);
        GetExpenseCategories().then(setCategories).catch(console.error);
    }, []);

    const fetchExpenses = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await GetExpenses({
                status: filterStatus === 'all' ? undefined : filterStatus,
                shop_id: selectedShopId === 'all' ? undefined : Number(selectedShopId),
                skip: (p - 1) * PAGE_SIZE,
                limit: PAGE_SIZE,
            });
            setExpenses(data.items);
            setTotal(data.total);
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, selectedShopId]);

    useEffect(() => { fetchExpenses(page); }, [page, fetchExpenses]);

    useEffect(() => { setPage(1); }, [filterStatus, selectedShopId]);

    const visibleExpenses = onlyMine ? expenses.filter((e) => e.submitted_by === user?.id) : expenses;

    const openDetail = (id: number) => {
        setSelectedExpenseId(id);
        setDetailOpen(true);
    };

    const openNewExpense = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (expense: ExpenseResponse) => {
        setDetailOpen(false);
        setEditing(expense);
        setFormOpen(true);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Expenses"
                description="Submit and review business expenses."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => fetchExpenses(page)} disabled={loading} aria-label="Refresh expenses">
                            <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
                        </Button>
                        <Button onClick={openNewExpense}>
                            <Plus className="mr-2 size-4" />
                            New Expense
                        </Button>
                    </div>
                }
            />

            <Card className="gap-0 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-border bg-muted/30 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ExpenseStatus | 'all')}>
                            <SelectTrigger className="h-9 w-[160px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="All statuses" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                            <SelectTrigger className="h-9 w-[170px]">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="text-muted-foreground size-3.5" />
                                    <SelectValue placeholder="All shops" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All shops</SelectItem>
                                {shops.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
                        <Label htmlFor="only-mine" className="flex items-center gap-1.5 text-xs">
                            <User className="size-3.5" /> My expenses only (this page)
                        </Label>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Expense #</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Submitted By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8} className="px-6 py-4">
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : visibleExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="p-0">
                                        <EmptyState
                                            icon={ReceiptText}
                                            title="No expenses found"
                                            description="Submitted expenses will show up here."
                                            actions={<Button onClick={openNewExpense}>New Expense</Button>}
                                            className="border-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleExpenses.map((exp) => (
                                    <TableRow key={exp.id} className="cursor-pointer" onClick={() => openDetail(exp.id)}>
                                        <TableCell className="pl-6 font-medium">{exp.expense_number}</TableCell>
                                        <TableCell className="text-sm">{categoryName(exp.category_id)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{exp.vendor_name || '—'}</TableCell>
                                        <TableCell className="text-right font-medium">{fmt(exp.amount)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(exp.expense_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {exp.submitted_by === user?.id ? 'You' : `User #${exp.submitted_by}`}
                                        </TableCell>
                                        <TableCell>
                                            <StatusPill status={exp.status} />
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                aria-label="View expense"
                                                onClick={(e) => { e.stopPropagation(); openDetail(exp.id); }}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} total={total} />

            <ExpenseFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                editing={editing}
                shops={shops}
                onSuccess={() => fetchExpenses(page)}
            />
            <ExpenseDetailDialog
                expenseId={selectedExpenseId}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onChanged={() => fetchExpenses(page)}
                onEdit={openEdit}
                categories={categories}
                shops={shops}
            />
        </div>
    );
}
