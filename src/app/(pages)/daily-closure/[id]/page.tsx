"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    FileText,
    Package,
    Calculator,
    AlertCircle,
    CheckCircle2,
    Banknote,
    Receipt,
    ClipboardCheck,
    Plus,
    Minus,
    Equal,
    XCircle,
    CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Table, Typography, Divider, Skeleton, Modal, message, Input } from "antd";
import { format } from "date-fns";
import { GetClosureDetails, VerifyDailyClosure } from "@/(api-handlers)/dailyClosureHandler";
import { DailyClosureDetailResponse } from "@/interfaces/dailyClosure";
import PageHeader from "@/components/(shared-components)/PageHeader";
import { cn } from "@/lib/utils";

const { Title, Text } = Typography;

export default function ClosureDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [closure, setClosure] = useState<DailyClosureDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [discrepancyReason, setDiscrepancyReason] = useState("");

    useEffect(() => {
        if (params.id) {
            fetchDetails();
        }
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
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (status: 'verified' | 'rejected') => {
        if (!closure) return;
        
        setIsActionLoading(true);
        try {
            await VerifyDailyClosure(closure.id, {
                status: status,
                discrepancy_reason: discrepancyReason
            });
            message.success(`Closure ${status} successfully`);
            fetchDetails();
        } catch (error) {
            message.error(`Failed to ${status} closure`);
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    if (!closure) {
        return (
            <div className="p-6 text-center">
                <Title level={4}>Closure not found</Title>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const productColumns = [
        {
            title: 'Product Name',
            dataIndex: 'product_name',
            key: 'product_name',
            render: (text: string) => <Text className="font-medium text-slate-700">{text}</Text>
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            render: (val: number) => `₵${val.toFixed(2)}`
        },
        {
            title: 'Quantity Sold',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (val: number) => <Text strong>{val}</Text>
        },
        {
            title: 'Total Sales',
            dataIndex: 'total_sales',
            key: 'total_sales',
            render: (val: number) => (
                <Text strong className="text-primary-color text-base">
                    ₵{val.toFixed(2)}
                </Text>
            )
        }
    ];

    return (
        <div className="p-6 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full bg-white shadow-sm"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <PageHeader
                    title={`Closure Details: ${closure.closure_number}`}
                    description={`Detailed sales and reconciliation report for ${format(new Date(closure.closure_date), 'PPP')}`}
                />
            </div>

            {/* Status Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm bg-white",
                    closure.status === 'verified' ? "border-emerald-100 bg-emerald-50/20" :
                        closure.status === 'rejected' ? "border-rose-100 bg-rose-50/20" : "border-amber-100 bg-amber-50/20"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                        closure.status === 'verified' ? "bg-emerald-500 text-white" :
                            closure.status === 'rejected' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                    )}>
                        {closure.status === 'verified' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                closure.status === 'verified' ? "bg-emerald-100 text-emerald-700" :
                                    closure.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {closure.status}
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 leading-tight">
                            {closure.status === 'verified' ? "Reconciliation Complete" :
                                closure.status === 'rejected' ? "Submission Rejected" : "Pending Administrator Review"}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {closure.status === 'verified' ? 
                                `Verified & Approved by ID#${closure.verified_by}` : 
                                closure.closed_at ? `Submitted by Attendant on ${format(new Date(closure.closed_at), 'PPP p')}` : 
                                "Awaiting end-of-day submission"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Difference</span>
                        <div className={cn(
                            "text-2xl font-semibold tabular-nums",
                            closure.cash_difference < -0.01 ? "text-rose-600" : closure.cash_difference > 0.01 ? "text-emerald-600" : "text-slate-900"
                        )}>
                            {closure.cash_difference > 0 ? "+" : ""}₵{closure.cash_difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    
                    {(closure.status === 'submitted' || closure.status === 'discrepancy') && (
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                loading={isActionLoading}
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Approve Reconciliation?',
                                        content: 'Are you sure you want to verify and approve these figures?',
                                        onOk: () => handleVerifySubmit('verified'),
                                        centered: true
                                    });
                                }}
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                loading={isActionLoading}
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Reject Submission?',
                                        content: (
                                            <div className="space-y-3 pt-4">
                                                <p>Provide a reason for rejection:</p>
                                                <Input.TextArea 
                                                    value={discrepancyReason} 
                                                    onChange={e => setDiscrepancyReason(e.target.value)}
                                                    placeholder="e.g. Cash count doesn't match..."
                                                />
                                            </div>
                                        ),
                                        onOk: () => handleVerifySubmit('rejected'),
                                        okText: 'Reject',
                                        okButtonProps: { danger: true },
                                        centered: true
                                    });
                                }}
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Net Sales', value: `₵${closure.net_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, subValue: `₵${closure.total_tax.toFixed(2)} Tax`, icon: Banknote, color: 'emerald' },
                    { label: 'Actual Cash', value: `₵${closure.actual_cash?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}`, subValue: 'Counter submission', icon: Receipt, color: 'amber' },
                    { label: 'Total Items', value: closure.total_items, subValue: `${closure.total_orders} Orders`, icon: Package, color: 'indigo' },
                    { label: 'Avg Order', value: `₵${(closure.net_sales / (closure.total_orders || 1)).toFixed(2)}`, subValue: 'Per customer', icon: Calculator, color: 'sky' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", {
                            'bg-emerald-50 text-emerald-500': stat.color === 'emerald',
                            'bg-indigo-50 text-indigo-500': stat.color === 'indigo',
                            'bg-sky-50 text-sky-500': stat.color === 'sky',
                            'bg-amber-50 text-amber-500': stat.color === 'amber',
                        })}>
                            <stat.icon className="w-4.5 h-4.5" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{stat.value}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{stat.subValue}</p>
                    </motion.div>
                ))}
            </div>

            {/* Financial Reconciliation Breakdown */}
            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <ClipboardCheck className="w-4 h-4 text-primary-color" />
                        Financial Reconciliation Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs">How the system calculated your final cash difference</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* Left Side: Expected Cash Logic */}
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. Expected Cash Result</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">Formula: Bal + Sales</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Calculator className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-slate-600">Opening Balance (Float)</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">₵{closure.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-center -my-2 py-1">
                                    <Plus className="w-3 h-3 text-slate-300" />
                                </div>

                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                            <Banknote className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-slate-600">Total Cash Sales</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">₵{closure.cash_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Equal className="w-4 h-4 text-primary-color" />
                                        <span className="text-sm font-black text-slate-900 uppercase">Expected Cash</span>
                                    </div>
                                    <span className="text-lg font-black text-primary-color">₵{closure.expected_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Final Difference Logic */}
                        <div className="p-6 md:p-8 space-y-6 bg-slate-50/30">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. Cash Difference Result</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">Formula: Actual - Exp</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Receipt className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-slate-600">Actual Cash Submitted</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">₵{closure.actual_cash?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</span>
                                </div>

                                <div className="flex justify-center -my-2 py-1">
                                    <Minus className="w-3 h-3 text-slate-300" />
                                </div>

                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Calculator className="w-4 h-4 opacity-50" />
                                        </div>
                                        <span className="text-sm text-slate-500 italic">Total Expected Cash</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400">₵{closure.expected_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Equal className="w-4 h-4 text-slate-900" />
                                        <span className="text-sm font-black text-slate-900 uppercase">Final Difference</span>
                                    </div>
                                    <span className={cn(
                                        "text-lg font-black",
                                        closure.cash_difference < -0.01 ? "text-rose-600" : closure.cash_difference > 0.01 ? "text-emerald-600" : "text-slate-900"
                                    )}>
                                        {closure.cash_difference > 0 ? "+" : ""}₵{closure.cash_difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <FileText className="w-4 h-4 text-primary-color" />
                                Sold Products Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table
                                columns={productColumns}
                                dataSource={closure.sold_products}
                                rowKey="product_name"
                                pagination={{ pageSize: 10 }}
                                className="custom-table"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
                            <CardTitle className="text-sm font-bold text-slate-800">Metadata & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium"> Reference No.</span>
                                <span className="font-bold text-slate-700 font-mono">#{closure.closure_number}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium"> Closure Date</span>
                                <span className="font-bold text-slate-700">{format(new Date(closure.closure_date), 'PP')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium"> Opening Time</span>
                                <span className="font-bold text-slate-700">{format(new Date(closure.opened_at), 'p')}</span>
                            </div>
                            <Divider className="my-2" />
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendant Notes</span>
                                <div className="p-4 bg-slate-50/50 rounded-xl text-sm text-slate-600 italic border border-slate-100 leading-relaxed">
                                    &quot;{closure.notes || "No notes provided"}&quot;
                                </div>
                            </div>
                            {closure.discrepancy_reason && (
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Verification Reason</span>
                                    <div className="p-4 bg-rose-50/50 rounded-xl text-sm text-rose-600 italic border border-rose-100 leading-relaxed">
                                        &quot;{closure.discrepancy_reason}&quot;
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
