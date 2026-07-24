"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft, FileText, Package, Calculator,
    AlertCircle, CheckCircle2, Banknote, Receipt,
    ClipboardCheck, Plus, Minus, Equal, XCircle, CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GetClosureDetails, VerifyDailyClosure } from "@/(api-handlers)/dailyClosureHandler";
import { DailyClosureDetailResponse } from "@/interfaces/dailyClosure";
import PageHeader from "@/components/(shared-components)/PageHeader";
import { cn } from "@/lib/utils";
import { safeFormat } from "@/lib/safeFormat";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string; cls: string }> = {
        verified:  { label: 'Verified',   cls: 'border-success/30 bg-success/10 text-success' },
        submitted: { label: 'Submitted',  cls: 'border-warning/30 bg-warning/10 text-warning-foreground' },
        rejected:  { label: 'Rejected',   cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
        discrepancy: { label: 'Discrepancy', cls: 'border-warning/30 bg-warning/10 text-warning-foreground' },
    };
    const { label, cls } = configs[status] ?? { label: status.toUpperCase(), cls: 'border-border bg-muted text-muted-foreground' };
    return <Badge variant="outline" className={cn("rounded-full text-xs font-bold uppercase", cls)}>{label}</Badge>;
}

export default function ClosureDetailPage() {
    const fmt = useCurrency();
    const params = useParams();
    const router = useRouter();
    const [closure, setClosure] = useState<DailyClosureDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [discrepancyReason, setDiscrepancyReason] = useState("");
    const [pendingAction, setPendingAction] = useState<'verified' | 'rejected' | null>(null);

    useEffect(() => {
        if (params.id) fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const data = await GetClosureDetails(Number(params.id));
            setClosure(data);
            if (data.discrepancy_reason) setDiscrepancyReason(data.discrepancy_reason);
        } catch (error) {
            console.error("Failed to fetch closure details", error);
            toast.error("Failed to load closure details");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (status: 'verified' | 'rejected') => {
        if (!closure) return;
        setIsActionLoading(true);
        try {
            await VerifyDailyClosure(closure.id, { status, discrepancy_reason: discrepancyReason });
            toast.success(`Closure ${status} successfully`);
            fetchDetails();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${status} closure`);
        } finally {
            setIsActionLoading(false);
            setPendingAction(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-12 w-64 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-px">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded" />)}
                </div>
                <Skeleton className="h-64 rounded" />
            </div>
        );
    }

    if (!closure) {
        return (
            <div className="flex flex-col gap-6">
                <div className="text-center py-20">
                    <p className="text-foreground font-semibold text-lg">Closure not found</p>
                    <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    const canVerify = closure.status === 'submitted' || closure.status === 'discrepancy';

    return (
        <div className="flex flex-col gap-6">
            {/* Back + header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="size-10 rounded-full shrink-0" onClick={() => router.back()}>
                    <ChevronLeft className="size-5" />
                </Button>
                <PageHeader
                    title={`Closure: ${closure.closure_number}`}
                    description={`Detailed reconciliation for ${safeFormat(closure.closure_date, 'PPP')}`}
                />
            </div>

            {/* Status banner */}
            <div className={cn(
                "rounded-lg border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4",
                closure.status === 'verified'
                    ? "border-success/30 bg-success/5"
                    : closure.status === 'rejected'
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-warning/30 bg-warning/5"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "flex size-12 items-center justify-center rounded-xl text-white",
                        closure.status === 'verified' ? "bg-success" :
                            closure.status === 'rejected' ? "bg-destructive" : "bg-warning"
                    )}>
                        {closure.status === 'verified' ? <CheckCircle2 className="size-6" /> : <AlertCircle className="size-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Status</span>
                            <StatusBadge status={closure.status} />
                        </div>
                        <h2 className="text-foreground text-lg font-semibold leading-tight">
                            {closure.status === 'verified' ? 'Reconciliation Complete' :
                                closure.status === 'rejected' ? 'Submission Rejected' : 'Pending Administrator Review'}
                        </h2>
                        <p className="text-muted-foreground text-xs">
                            {closure.status === 'verified'
                                ? `Verified by ID#${closure.verified_by}`
                                : closure.closed_at
                                    ? `Submitted on ${safeFormat(closure.closed_at, 'PPP p')}`
                                    : 'Awaiting end-of-day submission'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                    <div>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">Total Difference</p>
                        <p className={cn(
                            "text-2xl font-bold tabular-nums",
                            closure.cash_difference < -0.01 ? "text-destructive" :
                                closure.cash_difference > 0.01 ? "text-success" : "text-foreground"
                        )}>
                            {closure.cash_difference > 0 ? '+' : ''}{fmt(closure.cash_difference)}
                        </p>
                    </div>

                    {canVerify && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="bg-success text-success-foreground hover:bg-success/90"
                                disabled={isActionLoading}
                                onClick={() => setPendingAction('verified')}
                            >
                                <CheckCircle className="mr-1 size-4" /> Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                disabled={isActionLoading}
                                onClick={() => setPendingAction('rejected')}
                            >
                                <XCircle className="mr-1 size-4" /> Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border overflow-hidden rounded-2xl border">
                {[
                    { label: 'Net Sales',    value: fmt(closure.net_sales), sub: `${fmt(closure.total_tax)} Tax`,    icon: Banknote,    color: 'text-success' },
                    { label: 'Actual Cash',  value: fmt(closure.actual_cash ?? 0), sub: 'Counter submission', icon: Receipt,    color: 'text-warning-foreground' },
                    { label: 'Total Items',  value: String(closure.total_items), sub: `${closure.total_orders} Orders`,                          icon: Package,    color: 'text-info' },
                    { label: 'Avg Order',    value: fmt(closure.net_sales / (closure.total_orders || 1)), sub: 'Per customer',    icon: Calculator, color: 'text-primary' },
                ].map(stat => (
                    <div key={stat.label} className="bg-card flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-4 py-8 sm:px-6">
                        <dt className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                            <stat.icon className={cn("size-5", stat.color)} />
                            {stat.label}
                        </dt>
                        <dd className="text-foreground mt-2 w-full flex-none text-3xl font-bold tracking-tight">{stat.value}</dd>
                        <dd className="text-muted-foreground mt-1 text-xs font-medium">{stat.sub}</dd>
                    </div>
                ))}
            </dl>

            {/* Financial Reconciliation Breakdown */}
            <Card className="overflow-hidden">
                <div className="border-b px-6 py-4">
                    <h3 className="text-foreground flex items-center gap-2 font-semibold">
                        <ClipboardCheck className="text-primary size-5" />
                        Financial Reconciliation Breakdown
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1">How the system calculated your final cash difference</p>
                </div>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                        <div className="p-6 md:p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">1. Expected Cash Result</h3>
                                <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-[10px] font-bold uppercase">Bal + Sales</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
                                        <Calculator className="text-muted-foreground size-4" />
                                    </div>
                                    <span className="text-muted-foreground text-sm">Opening Balance (Float)</span>
                                </div>
                                <span className="text-foreground text-sm font-bold">{fmt(closure.opening_balance)}</span>
                            </div>
                            <div className="flex justify-center"><Plus className="text-muted-foreground/40 size-3" /></div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-success/10 flex size-8 items-center justify-center rounded-lg">
                                        <Banknote className="text-success size-4" />
                                    </div>
                                    <span className="text-muted-foreground text-sm">Total Cash Sales</span>
                                </div>
                                <span className="text-success text-sm font-bold">{fmt(closure.cash_total)}</span>
                            </div>
                            <div className="border-border flex justify-between items-center border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <Equal className="text-primary size-4" />
                                    <span className="text-foreground text-sm font-black uppercase">Expected Cash</span>
                                </div>
                                <span className="text-primary text-lg font-black">{fmt(closure.expected_cash)}</span>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-6 md:p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">2. Cash Difference Result</h3>
                                <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-[10px] font-bold uppercase">Actual − Exp</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
                                        <Receipt className="text-muted-foreground size-4" />
                                    </div>
                                    <span className="text-muted-foreground text-sm">Actual Cash Submitted</span>
                                </div>
                                <span className="text-foreground text-sm font-bold">{fmt(closure.actual_cash ?? 0)}</span>
                            </div>
                            <div className="flex justify-center"><Minus className="text-muted-foreground/40 size-3" /></div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
                                        <Calculator className="text-muted-foreground/50 size-4" />
                                    </div>
                                    <span className="text-muted-foreground text-sm italic">Total Expected Cash</span>
                                </div>
                                <span className="text-muted-foreground text-sm font-bold">{fmt(closure.expected_cash)}</span>
                            </div>
                            <div className="border-border flex justify-between items-center border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <Equal className="text-foreground size-4" />
                                    <span className="text-foreground text-sm font-black uppercase">Final Difference</span>
                                </div>
                                <span className={cn(
                                    "text-lg font-black",
                                    closure.cash_difference < -0.01 ? "text-destructive" :
                                        closure.cash_difference > 0.01 ? "text-success" : "text-foreground"
                                )}>
                                    {closure.cash_difference > 0 ? '+' : ''}{fmt(closure.cash_difference)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sold Products */}
                <div className="lg:col-span-2">
                    <Card className="gap-0 overflow-hidden p-0">
                        <div className="border-b px-6 py-4">
                            <h3 className="text-foreground flex items-center gap-2 font-semibold">
                                <FileText className="text-primary size-4" />
                                Sold Products Breakdown
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Product Name</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Qty Sold</TableHead>
                                        <TableHead className="pr-6">Total Sales</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {closure.sold_products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                                                No products recorded.
                                            </TableCell>
                                        </TableRow>
                                    ) : closure.sold_products.map(p => (
                                        <TableRow key={p.product_name}>
                                            <TableCell className="pl-6 font-medium">{p.product_name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{fmt(p.unit_price)}</TableCell>
                                            <TableCell className="font-bold">{p.quantity}</TableCell>
                                            <TableCell className="pr-6 text-primary font-bold">{fmt(p.total_sales)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Metadata & Notes */}
                <div>
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b">
                            <CardTitle className="text-sm font-bold">Metadata & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {[
                                { label: 'Reference No.', value: `#${closure.closure_number}`, mono: true },
                                { label: 'Closure Date',  value: safeFormat(closure.closure_date, 'PP') },
                                { label: 'Opening Time',  value: safeFormat(closure.opened_at, 'p') },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">{row.label}</span>
                                    <span className={cn("text-foreground font-bold", row.mono && "font-mono")}>{row.value}</span>
                                </div>
                            ))}

                            <div className="border-border border-t pt-3 space-y-2">
                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Attendant Notes</p>
                                <div className="bg-muted/50 rounded-xl border p-4 text-sm italic text-muted-foreground leading-relaxed">
                                    &quot;{closure.notes || 'No notes provided'}&quot;
                                </div>
                            </div>

                            {closure.discrepancy_reason && (
                                <div className="space-y-2">
                                    <p className="text-destructive text-[10px] font-black uppercase tracking-widest">Verification Reason</p>
                                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm italic text-destructive leading-relaxed">
                                        &quot;{closure.discrepancy_reason}&quot;
                                    </div>
                                </div>
                            )}

                            {canVerify && (
                                <div className="border-border border-t pt-4 space-y-2">
                                    <Label className="text-sm font-semibold">Rejection Reason (if rejecting)</Label>
                                    <Textarea
                                        placeholder="e.g. Cash count doesn't match..."
                                        value={discrepancyReason}
                                        onChange={e => setDiscrepancyReason(e.target.value)}
                                        className="resize-none"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirm action dialog */}
            <AlertDialog open={!!pendingAction} onOpenChange={open => !open && setPendingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === 'verified' ? 'Approve Reconciliation?' : 'Reject Submission?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === 'verified'
                                ? 'Are you sure you want to verify and approve these figures?'
                                : 'This will send the record back for correction. Please ensure you have provided a reason.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(
                                pendingAction === 'rejected'
                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    : ''
                            )}
                            onClick={() => pendingAction && handleVerifySubmit(pendingAction)}
                        >
                            {pendingAction === 'verified' ? 'Yes, Approve' : 'Reject'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
