"use client";

import {
    Banknote,
    Calculator,
    Calendar,
    Clock,
    FileText,
    RefreshCcw,
    ClipboardCheck,
    Receipt
} from "lucide-react";
import { DailyClosureResponse } from "@/interfaces/dailyClosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    onOpenModal
}: Readonly<AttendantViewProps>) {
    const status = closure?.status?.toLowerCase() || "";

    if (!closure) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border">
                <div className="bg-muted p-6 rounded-full mb-6">
                    <Calculator className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">No active closure data</h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-center">
                    Make your first sale of the day, or start a new manual closure to track your daily intake.
                </p>
                <div className="flex items-center gap-4 mt-8">
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="lg"
                        className="rounded-xl px-8 font-bold"
                    >
                        <RefreshCcw className="mr-2 h-5 w-5" /> Refresh
                    </Button>
                    <Button
                        onClick={onOpenModal}
                        size="lg"
                        className="rounded-xl px-8 shadow-lg shadow-primary/20 transition-all font-bold"
                    >
                        <Banknote className="mr-2 h-5 w-5" /> Open Closure
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status banners */}
            {status === 'rejected' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/5 border border-destructive/20 p-3 rounded-md flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center shadow-lg shadow-destructive/20">
                        <RefreshCcw className="w-6 h-6 text-destructive-foreground" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-destructive">Submission Rejected by Admin</h4>
                        <p className="text-sm text-destructive">Please review the reason below, correct your figures, and re-submit.</p>
                    </div>
                </motion.div>
            )}

            {(status === 'submitted' || status === 'discrepancy') && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-warning/10 border border-warning/30 p-6 rounded-3xl flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-warning rounded-2xl flex items-center justify-center shadow-lg shadow-warning/20">
                        <Clock className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-warning-foreground">Awaiting Admin Verification</h4>
                        <p className="text-sm text-warning-foreground">Your counts have been submitted. The admin is currently reviewing the reconciliation.</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Stats Grid */}
                    <dl className="mx-auto grid grid-cols-1 gap-px bg-border overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4 shadow-sm w-full mb-8">
                        {[
                            { label: 'Total Orders', value: closure.total_orders, icon: Receipt, textColor: 'text-primary' },
                            { label: 'Total Items', value: closure.total_items, icon: Calculator, textColor: 'text-primary' },
                            { label: 'Customers', value: closure.total_customers, icon: FileText, textColor: 'text-primary' },
                            { label: 'Net Sales', value: `₵${closure.net_sales.toFixed(2)}`, icon: Banknote, textColor: 'text-success' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-card px-4 py-8 sm:px-6 xl:px-8"
                            >
                                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <stat.icon className={cn("size-5", stat.textColor)} />
                                    {stat.label}
                                </dt>
                                <dd className="w-full flex-none text-3xl font-bold tracking-tight text-foreground mt-2">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/* Detailed Breakdown */}
                    <Card className="border-0 shadow-xl overflow-hidden rounded-2xl">
                        <div className="p-6 border-b bg-muted/20">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-primary" />
                                Financial Reconciliation
                            </h3>
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                <div className="p-8 space-y-6">
                                    <h3 className="font-bold text-foreground uppercase text-xs tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        Expected Revenue
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Cash Revenue</span>
                                            <span className="font-semibold text-foreground">₵{closure.cash_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Card Payments</span>
                                            <span className="font-semibold text-foreground">₵{closure.card_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Mobile Money</span>
                                            <span className="font-semibold text-foreground">₵{closure.mobile_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Store Credit</span>
                                            <span className="font-semibold text-foreground">₵{closure.credit_total.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-dashed flex justify-between items-center">
                                            <span className="font-bold text-foreground">Gross Sales</span>
                                            <span className="font-extrabold text-foreground text-lg">₵{closure.gross_sales.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6 bg-muted/20">
                                    <h3 className="font-bold text-foreground uppercase text-xs tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-4 bg-success rounded-full" />
                                        Cash Summary
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Opening Balance</span>
                                            <span className="font-semibold text-foreground">₵{closure.opening_balance.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Expected Cash</span>
                                            <span className="font-bold text-primary text-lg">₵{closure.expected_cash.toFixed(2)}</span>
                                        </div>

                                        {status === 'verified' && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Actual Cash Submitted</span>
                                                    <span className="font-semibold text-foreground">₵{closure.actual_cash.toFixed(2)}</span>
                                                </div>
                                                <div className="pt-4 border-t flex justify-between items-center">
                                                    <span className="font-bold text-foreground">Difference</span>
                                                    <span className={cn(
                                                        "font-extrabold text-lg",
                                                        closure.cash_difference < 0 ? "text-destructive" : "text-success"
                                                    )}>
                                                        {closure.cash_difference > 0 ? "+" : ""}₵{closure.cash_difference.toFixed(2)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    {(() => {
                        if (status === 'opened' || status === 'open' || status === 'rejected') {
                            return (
                                <Card className={cn(
                                    "rounded-3xl shadow-xl overflow-hidden",
                                    status === 'rejected' ? "border-destructive/20" : "border-primary/10"
                                )}>
                                    <div className={cn("h-2", status === 'rejected' ? "bg-destructive" : "bg-primary")} />
                                    <CardHeader>
                                        <CardTitle className="text-xl">
                                            {status === 'rejected' ? "Revise & Re-submit" : "Submit Closure"}
                                        </CardTitle>
                                        <CardDescription>
                                            {status === 'rejected'
                                                ? "Your submission was rejected. Please correct the details and try again."
                                                : "Enter the actual cash on hand to proceed with the daily closure."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {status === 'rejected' && closure.discrepancy_reason && (
                                            <div className="p-4 bg-destructive/5 rounded-md border border-destructive/10 mb-2">
                                                <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1">Rejection Reason</p>
                                                <p className="text-sm text-foreground italic">&quot;{closure.discrepancy_reason}&quot;</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-foreground ml-1">Actual Cash Counted</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₵</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={actualCash}
                                                    onChange={(e) => setActualCash(e.target.value)}
                                                    className="pl-8 h-12 bg-muted border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-xl font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-foreground ml-1">Additional Notes</label>
                                            <Textarea
                                                placeholder="Enter any discrepancies or observations..."
                                                className="min-h-[120px] bg-muted border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl resize-none p-4 text-foreground"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className={cn(
                                                "w-full h-13 rounded-md font-bold text-base shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group",
                                                status === 'rejected'
                                                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20"
                                                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                                            )}
                                            disabled={isActionLoading}
                                            onClick={handleSubmitClosure}
                                        >
                                            {isActionLoading ? (
                                                <RefreshCcw className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <ClipboardCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                            )}
                                            <span>{status === 'rejected' ? "Re-submit for Verification" : "Submit for Verification"}</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        }
                        if (status === 'submitted' || status === 'discrepancy') {
                            return (
                                <Card className="rounded-3xl border-warning/20 bg-warning/5">
                                    <CardContent className="pt-6 text-center space-y-4">
                                        <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                                            <Clock className="w-6 h-6 text-warning-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-warning-foreground">Submission Pending</h4>
                                            <p className="text-sm text-warning-foreground mt-1">Your daily closure is waiting for administrator verification.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }
                        if (status === 'verified') {
                            return (
                                <Card className="rounded-3xl border-success/20 bg-success/5 overflow-hidden">
                                    <div className="h-2 bg-success" />
                                    <CardContent className="pt-8 text-center space-y-6">
                                        <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                            <ClipboardCheck className="w-8 h-8 text-success" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-extrabold text-foreground text-xl tracking-tight">Verified & Closed</h4>
                                            <p className="text-sm text-muted-foreground">Reconciled on {format(new Date(closure.closed_at), 'PPP')}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }
                        return null;
                    })()}

                    <Card className="rounded-3xl">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Opening Time</p>
                                    <p className="text-sm font-semibold text-foreground">{format(new Date(closure.opened_at), 'ppp')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reference No.</p>
                                    <p className="text-sm font-semibold text-foreground">#{closure.closure_number}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
