"use client";

import {
    Banknote, Calculator, Calendar, Clock, FileText,
    RefreshCcw, ClipboardCheck, Receipt, Users, CheckCircle, XCircle,
} from "lucide-react";
import { DailyClosureResponse } from "@/interfaces/dailyClosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrency, useOrgCurrency } from "@/hooks/useCurrency";

interface AttendantViewProps {
    closure: DailyClosureResponse | null;
    isActionLoading: boolean;
    handleSubmitClosure: () => Promise<void>;
    actualCash: string;
    setActualCash: (val: string) => void;
    notes: string;
    setNotes: (val: string) => void;
    onOpenModal: () => void;
}

export default function AttendantView({
    closure,
    isActionLoading,
    handleSubmitClosure,
    actualCash,
    setActualCash,
    notes,
    setNotes,
    onOpenModal,
}: Readonly<AttendantViewProps>) {
    const fmt         = useCurrency();
    const orgCurrency = useOrgCurrency();
    const status      = closure?.status?.toLowerCase() ?? "";

    if (!closure) {
        return (
            <Card className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                    <Calculator className="text-muted-foreground size-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold">No active closure</h3>
                    <p className="text-muted-foreground max-w-sm text-sm">
                        Start a new daily closure to begin tracking today&apos;s financial activity.
                    </p>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCcw className="size-4" /> Refresh
                    </Button>
                    <Button onClick={onOpenModal}>
                        <Banknote className="size-4" /> Open Closure
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Status banners */}
            {status === "rejected" && (
                <div className="border-destructive/30 bg-destructive/10 flex items-center gap-3 rounded-xl border p-4">
                    <div className="bg-destructive/20 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <XCircle className="text-destructive size-5" />
                    </div>
                    <div>
                        <p className="text-destructive text-sm font-semibold">Submission Rejected</p>
                        <p className="text-destructive/80 text-xs">
                            Review the reason below, correct your figures, and re-submit.
                        </p>
                    </div>
                </div>
            )}

            {(status === "submitted" || status === "discrepancy") && (
                <div className="border-warning/30 bg-warning/10 flex items-center gap-3 rounded-xl border p-4">
                    <div className="bg-warning/20 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Clock className="text-warning-foreground size-5 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-warning-foreground text-sm font-semibold">Awaiting Admin Verification</p>
                        <p className="text-warning-foreground/80 text-xs">
                            Your closure has been submitted and is pending review.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                    { label: "Total Orders",  value: closure.total_orders,               icon: Receipt,    accent: false },
                    { label: "Total Items",   value: closure.total_items,                icon: Calculator, accent: false },
                    { label: "Customers",     value: closure.total_customers,            icon: Users,      accent: false },
                    { label: "Net Sales",     value: fmt(closure.net_sales),             icon: Banknote,   accent: true  },
                ].map(stat => (
                    <Card key={stat.label} className="p-4">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex size-8 items-center justify-center rounded-lg",
                                stat.accent ? "bg-success/10" : "bg-primary/10",
                            )}>
                                <stat.icon className={cn("size-4", stat.accent ? "text-success" : "text-primary")} />
                            </div>
                            <p className="text-muted-foreground text-sm">{stat.label}</p>
                        </div>
                        <p className={cn(
                            "mt-2 text-2xl font-bold tracking-tight",
                            stat.accent && "text-success",
                        )}>
                            {stat.value}
                        </p>
                    </Card>
                ))}
            </div>

            {/* Main layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Financial breakdown — spans 2 cols */}
                <Card className="gap-0 overflow-hidden p-0 lg:col-span-2">
                    <div className="border-border border-b p-5">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <ClipboardCheck className="text-primary size-4" /> Financial Breakdown
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                        {/* Revenue */}
                        <div className="space-y-3 p-5">
                            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Revenue
                            </p>
                            {([
                                ["Cash",         closure.cash_total],
                                ["Card",         closure.card_total],
                                ["Mobile Money", closure.mobile_total],
                                ["Store Credit", closure.credit_total],
                            ] as [string, number][]).map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="num-tabular font-medium">{fmt(val)}</span>
                                </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between">
                                <span className="font-semibold">Gross Sales</span>
                                <span className="num-tabular text-lg font-bold">{fmt(closure.gross_sales)}</span>
                            </div>
                        </div>

                        {/* Cash summary */}
                        <div className="bg-muted/30 space-y-3 p-5">
                            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Cash Summary
                            </p>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Opening Balance</span>
                                <span className="num-tabular font-medium">{fmt(closure.opening_balance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Cash Sales</span>
                                <span className="num-tabular font-medium">{fmt(closure.cash_total)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Expected Cash</span>
                                <span className="num-tabular text-primary font-semibold">{fmt(closure.expected_cash)}</span>
                            </div>
                            {status === "verified" && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Actual Cash</span>
                                        <span className="num-tabular font-medium">{fmt(closure.actual_cash)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Difference</span>
                                        <span className={cn(
                                            "num-tabular text-lg font-bold",
                                            closure.cash_difference < 0 ? "text-destructive" : "text-success",
                                        )}>
                                            {closure.cash_difference > 0 ? "+" : ""}{fmt(closure.cash_difference)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                    {/* Submit / status card */}
                    {(status === "opened" || status === "open" || status === "rejected") && (
                        <Card className={cn(
                            "gap-0 overflow-hidden p-0",
                            status === "rejected" && "border-destructive/30",
                        )}>
                            <div className={cn(
                                "border-border border-b p-5",
                                status === "rejected" && "bg-destructive/5",
                            )}>
                                <h3 className="font-semibold">
                                    {status === "rejected" ? "Revise & Re-submit" : "Submit Closure"}
                                </h3>
                                <p className="text-muted-foreground mt-0.5 text-sm">
                                    {status === "rejected"
                                        ? "Correct the details and re-submit."
                                        : "Enter actual cash counted to close the day."}
                                </p>
                            </div>
                            <div className="space-y-4 p-5">
                                {status === "rejected" && closure.discrepancy_reason && (
                                    <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3">
                                        <p className="text-destructive mb-1 text-[11px] font-semibold uppercase tracking-wide">
                                            Rejection reason
                                        </p>
                                        <p className="text-destructive/90 text-sm italic">
                                            &ldquo;{closure.discrepancy_reason}&rdquo;
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label>Actual cash counted</Label>
                                    <div className="relative">
                                        <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                                            {orgCurrency}
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            value={actualCash}
                                            onChange={e => setActualCash(e.target.value)}
                                            className="pl-12"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        placeholder="Any discrepancies or observations…"
                                        className="resize-none"
                                        rows={3}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    variant={status === "rejected" ? "destructive" : "default"}
                                    disabled={isActionLoading || !actualCash}
                                    onClick={handleSubmitClosure}
                                >
                                    {isActionLoading
                                        ? <RefreshCcw className="size-4 animate-spin" />
                                        : <ClipboardCheck className="size-4" />}
                                    {status === "rejected" ? "Re-submit for Verification" : "Submit for Verification"}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {(status === "submitted" || status === "discrepancy") && (
                        <Card className="border-warning/30 bg-warning/5 flex flex-col items-center gap-3 p-6 text-center">
                            <div className="bg-warning/10 flex size-12 items-center justify-center rounded-full">
                                <Clock className="text-warning-foreground size-6" />
                            </div>
                            <div>
                                <p className="text-warning-foreground font-semibold">Pending Verification</p>
                                <p className="text-warning-foreground/80 mt-1 text-sm">
                                    Waiting for administrator review.
                                </p>
                            </div>
                        </Card>
                    )}

                    {status === "verified" && (
                        <Card className="border-success/30 bg-success/5 flex flex-col items-center gap-3 p-6 text-center">
                            <div className="bg-success/10 flex size-12 items-center justify-center rounded-full">
                                <CheckCircle className="text-success size-6" />
                            </div>
                            <div>
                                <p className="font-bold">Verified &amp; Closed</p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Reconciled on {format(new Date(closure.closed_at), "PPP")}
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Meta info */}
                    <Card className="p-5">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
                                    <Calendar className="text-muted-foreground size-4" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">Opened</p>
                                    <p className="text-sm font-medium">{format(new Date(closure.opened_at), "PPp")}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                                <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
                                    <FileText className="text-muted-foreground size-4" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">Reference</p>
                                    <p className="text-sm font-medium">#{closure.closure_number}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
