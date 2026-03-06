"use client";

import {
    Banknote,
    Calculator,
    Calendar,
    FileText,
    RefreshCcw,
    ClipboardCheck,
    Receipt,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { Modal } from "antd";
import { DailyClosureResponse } from "@/interfaces/dailyClosure";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminViewProps {
    closure: DailyClosureResponse | null;
    isActionLoading: boolean;
    handleVerifyClosure: (status: 'verified' | 'rejected') => Promise<void>;
    discrepancyReason: string;
    setDiscrepancyReason: (val: string) => void;
}

export default function AdminView({
    closure,
    isActionLoading,
    handleVerifyClosure,
    discrepancyReason,
    setDiscrepancyReason
}: AdminViewProps) {
    const status = closure?.status?.toLowerCase() || "";

    if (!closure) {
        return (
            <Card className="border-dashed border-2 bg-slate-50/50 overflow-hidden">
                <CardHeader className="text-center py-12">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                    </div>
                    <CardTitle className="text-2xl font-bold">No Active Closure</CardTitle>
                    <CardDescription className="max-w-sm mx-auto mt-2 text-base">
                        Waiting for an attendant to open the closure for today.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Orders', value: closure.total_orders, icon: Receipt, color: 'blue' },
                        { label: 'Total Items', value: closure.total_items, icon: Calculator, color: 'purple' },
                        { label: 'Customers', value: closure.total_customers, icon: FileText, color: 'indigo' },
                        { label: 'Net Sales', value: `₵${closure.net_sales.toFixed(2)}`, icon: Banknote, color: 'emerald' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", {
                                'bg-blue-50 text-blue-500': stat.color === 'blue',
                                'bg-purple-50 text-purple-500': stat.color === 'purple',
                                'bg-indigo-50 text-indigo-500': stat.color === 'indigo',
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
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Cash Revenue</span>
                                        <span className="font-semibold text-slate-900">₵{closure.cash_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Card Payments</span>
                                        <span className="font-semibold text-slate-900">₵{closure.card_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Mobile Money</span>
                                        <span className="font-semibold text-slate-900">₵{closure.mobile_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Store Credit</span>
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

                                    {(status === 'submitted' || status === 'verified' || status === 'rejected') && (
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
                    if (status === 'submitted') {
                        return (
                            <Card className="rounded-3xl shadow-xl border-amber-200 ring-1 ring-amber-100 overflow-hidden">
                                <div className="h-2 bg-amber-500" />
                                <CardHeader>
                                    <CardTitle className="text-xl">Verify Closure</CardTitle>
                                    <CardDescription>Review the submitted data and approve or reject this closure.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-4 bg-amber-50 rounded-md border border-amber-100 space-y-3">
                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Attendant Submission</p>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm text-slate-600">Actual Cash:</span>
                                            <span className="text-xl font-extrabold text-slate-900">₵{closure.actual_cash.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-amber-200">
                                            <p className="text-xs text-slate-500 italic">&quot;{(closure.notes || "No notes provided")}&quot;</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Verification Comments</label>
                                        <Textarea
                                            placeholder="Reason for discrepancy or approval notes..."
                                            className="min-h-[100px] bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl resize-none p-4"
                                            value={discrepancyReason}
                                            onChange={(e) => setDiscrepancyReason(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    <Button
                                        className="w-full h-13 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                                        disabled={isActionLoading}
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Verify Daily Closure?',
                                                content: 'Are you sure you want to approve and verify this financial record? This action will close the record for this period.',
                                                onOk: () => handleVerifyClosure('verified'),
                                                okText: 'Yes, Verify',
                                                cancelText: 'Cancel',
                                                centered: true,
                                                maskClosable: true
                                            });
                                        }}
                                    >
                                        <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                        Approve & Verify
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-md border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                        disabled={isActionLoading}
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Reject Submission?',
                                                content: 'This will send the record back for correction. Please ensure you have provided a reason in the comments.',
                                                onOk: () => handleVerifyClosure('rejected'),
                                                okText: 'Reject',
                                                okButtonProps: { danger: true },
                                                cancelText: 'Cancel',
                                                centered: true,
                                                maskClosable: true
                                            });
                                        }}
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                        Reject Submission
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    }
                    if (status === 'opened' || status === 'open') {
                        return (
                            <Card className="rounded-3xl border-blue-100 bg-blue-50/50">
                                <CardContent className="pt-6 text-center space-y-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                        <RefreshCcw className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900">Actively Trading</h4>
                                        <p className="text-sm text-blue-700 mt-1">The shop is currently trading. Awaiting end-of-day submission from the attendant.</p>
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
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">Verified & Closed</h4>
                                        <p className="text-sm text-slate-500">Reconciled on {format(new Date(closure.closed_at), 'PPP')}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (status === 'rejected') {
                        return (
                            <Card className="rounded-3xl border-rose-100 bg-rose-50/30 overflow-hidden">
                                <div className="h-2 bg-rose-500" />
                                <CardContent className="pt-8 text-center space-y-6">
                                    <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                        <AlertCircle className="w-8 h-8 text-rose-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">Submission Rejected</h4>
                                        <p className="text-sm text-slate-500">Wait for the attendant to revise the records.</p>
                                    </div>
                                    {closure.discrepancy_reason && (
                                        <div className="p-4 bg-white/50 rounded-md border border-rose-100/50">
                                            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                                            <p className="text-sm text-slate-600 italic">&quot;{closure.discrepancy_reason}&quot;</p>
                                        </div>
                                    )}
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
    );
}
