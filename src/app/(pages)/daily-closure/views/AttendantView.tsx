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
}

export default function AttendantView({
    closure,
    isActionLoading,
    handleSubmitClosure,
    actualCash,
    setActualCash,
    notes,
    setNotes
}: Readonly<AttendantViewProps>) {
    const status = closure?.status?.toLowerCase() || "";

    if (!closure) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <Calculator className="h-16 w-16 text-slate-300" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800">No active closure data</h3>
                <p className="text-slate-500 mt-2 max-w-sm text-center">
                    Make your first sale of the day, or refresh the page to automatically generate your daily tally.
                </p>
                <Button
                    onClick={() => window.location.reload()}
                    size="lg"
                    className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 shadow-lg shadow-primary/20 transition-all font-bold"
                >
                    <RefreshCcw className="mr-2 h-5 w-5" /> Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Status Banner */}
            {status === 'rejected' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border border-rose-200 p-3 rounded-md flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-200">
                        <RefreshCcw className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-rose-900">Submission Rejected by Admin</h4>
                        <p className="text-sm text-rose-700">Please review the reason below, correct your figures, and re-submit.</p>
                    </div>
                </motion.div>
            )}

            {(status === 'submitted' || status === 'discrepancy') && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                        <Clock className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-amber-900">Awaiting Admin Verification</h4>
                        <p className="text-sm text-amber-700">Your counts have been submitted. The admin is currently reviewing the reconciliation.</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Orders', value: closure.total_orders, icon: Receipt, color: 'primary' },
                            { label: 'Total Items', value: closure.total_items, icon: Calculator, color: 'purple' },
                            { label: 'Customers', value: closure.total_customers, icon: FileText, color: 'primary' },
                            { label: 'Net Sales', value: `₵${closure.net_sales.toFixed(2)}`, icon: Banknote, color: 'emerald' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", {
                                    'bg-primary/10 text-primary-color': stat.color === 'primary',
                                    'bg-purple-50 text-purple-500': stat.color === 'purple',
                                    'bg-emerald-50 text-emerald-500': stat.color === 'emerald',
                                })}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Detailed Breakdown */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-primary-color" />
                                Financial Reconciliation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                <div className="p-8 space-y-6">
                                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary-color rounded-full" />
                                        Expected Revenue
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Cash Revenue</span>
                                            <span className="font-semibold text-slate-900">₵{closure.cash_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Card Payments</span>
                                            <span className="font-semibold text-slate-900">₵{closure.card_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Mobile Money</span>
                                            <span className="font-semibold text-slate-900">₵{closure.mobile_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Store Credit</span>
                                            <span className="font-semibold text-slate-900">₵{closure.credit_total.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                                            <span className="font-bold text-slate-800">Gross Sales</span>
                                            <span className="font-extrabold text-slate-900 text-lg">₵{closure.gross_sales.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6 bg-slate-50/30">
                                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                        Cash Summary
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Opening Balance</span>
                                            <span className="font-semibold text-slate-900">₵{closure.opening_balance.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Expected Cash</span>
                                            <span className="font-bold text-primary-color text-lg">₵{closure.expected_cash.toFixed(2)}</span>
                                        </div>

                                        {status === 'verified' && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Actual Cash Submitted</span>
                                                    <span className="font-semibold text-slate-900">₵{closure.actual_cash.toFixed(2)}</span>
                                                </div>
                                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                                    <span className="font-bold text-slate-800">Difference</span>
                                                    <span className={cn(
                                                        "font-extrabold text-lg",
                                                        closure.cash_difference < 0 ? "text-rose-600" : "text-emerald-600"
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
                                    status === 'rejected' ? "border-rose-200 ring-rose-100" : "border-primary-color/10 ring-primary-color/5"
                                )}>
                                    <div className={cn("h-2", status === 'rejected' ? "bg-rose-500" : "bg-primary-color")} />
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
                                            <div className="p-4 bg-rose-50 rounded-md border border-rose-100 mb-2">
                                                <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                                                <p className="text-sm text-slate-700 italic">&quot;{closure.discrepancy_reason}&quot;</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Actual Cash Counted</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₵</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={actualCash}
                                                    onChange={(e) => setActualCash(e.target.value)}
                                                    className="pl-8 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-xl font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Additional Notes</label>
                                            <Textarea
                                                placeholder="Enter any discrepancies or observations..."
                                                className="min-h-[120px] bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl resize-none p-4 text-slate-700"
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
                                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                                                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                                            )}
                                            disabled={isActionLoading}
                                            onClick={handleSubmitClosure}
                                        >
                                            {isActionLoading ? (
                                                <RefreshCcw className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <ClipboardCheck className="h-5 w-5 group-hover:scale-110 transition-transform text-white/90" />
                                            )}
                                            <span>{status === 'rejected' ? "Re-submit for Verification" : "Submit for Verification"}</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        }
                        if (status === 'submitted' || status === 'discrepancy') {
                            return (
                                <Card className="rounded-3xl border-amber-100 bg-amber-50/50">
                                    <CardContent className="pt-6 text-center space-y-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                            <Clock className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-900">Submission Pending</h4>
                                            <p className="text-sm text-amber-700 mt-1">Your daily closure is waiting for administrator verification.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }
                        if (status === 'verified') {
                            return (
                                <Card className="rounded-3xl border-emerald-100 bg-emerald-50/30 overflow-hidden">
                                    <div className="h-2 bg-emerald-500" />
                                    <CardContent className="pt-8 text-center space-y-6">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                            <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">Verified & Closed</h4>
                                            <p className="text-sm text-slate-500">Reconciled on {format(new Date(closure.closed_at), 'PPP')}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }
                        return null;
                    })()}

                    <Card className="rounded-3xl border-slate-100 shadow-sm">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opening Time</p>
                                    <p className="text-sm font-semibold text-slate-700">{format(new Date(closure.opened_at), 'ppp')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reference No.</p>
                                    <p className="text-sm font-semibold text-slate-700">#{closure.closure_number}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
