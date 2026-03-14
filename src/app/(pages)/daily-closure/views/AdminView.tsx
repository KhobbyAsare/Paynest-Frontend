import { useState, useEffect } from "react";
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
    Search,
    MoreVertical,
    Eye,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Modal, Tabs, Table, DatePicker, Tag, Typography, Dropdown } from "antd";
import { DailyClosureResponse } from "@/interfaces/dailyClosure";
import { GetAllClosures } from "@/(api-handlers)/dailyClosureHandler";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const { RangePicker } = DatePicker;

interface AdminViewProps {
    closure: DailyClosureResponse | null;
    isActionLoading: boolean;
    handleVerifyClosure: (status: 'verified' | 'rejected', closureId?: number) => Promise<void>;
    discrepancyReason: string;
    setDiscrepancyReason: (val: string) => void;
    activeShopId?: number;
}

export default function AdminView({
    closure,
    isActionLoading,
    handleVerifyClosure,
    discrepancyReason,
    setDiscrepancyReason,
    activeShopId
}: Readonly<AdminViewProps>) {
    const router = useRouter();
    const status = closure?.status?.toLowerCase() || "";
    const [history, setHistory] = useState<DailyClosureResponse[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [dateRange, setDateRange] = useState<[string, string] | null>(null);

    useEffect(() => {
        if (activeShopId) fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeShopId, dateRange]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await GetAllClosures(activeShopId!, dateRange?.[0], dateRange?.[1]);
            setHistory(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'closure_date',
            key: 'closure_date',
            render: (val: string) => format(new Date(val), 'MMM d, yyyy')
        },
        { title: 'Ref No.', dataIndex: 'closure_number', key: 'closure_number' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => {
                let color = '#10295E';
                if (val === 'verified') color = 'success';
                else if (val === 'submitted') color = 'warning';
                else if (val === 'rejected') color = 'error';
                return <Tag color={color}>{val.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Net Sales (₵)',
            dataIndex: 'net_sales',
            key: 'net_sales',
            render: (val: number) => val.toFixed(2)
        },
        {
            title: 'Total Tax (₵)',
            dataIndex: 'total_tax',
            key: 'total_tax',
            render: (val: number) => val.toFixed(2)
        },
        {
            title: 'Cash Diff',
            dataIndex: 'cash_difference',
            key: 'cash_difference',
            render: (val: number) => {
                const isNegative = val < 0;
                const isPositive = val > 0;
                return (
                    <span className={cn("font-medium", isNegative ? "text-rose-600" : isPositive ? "text-emerald-600" : "text-slate-600")}>
                        {isPositive ? '+' : ''}{val.toFixed(2)}
                    </span>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: DailyClosureResponse) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: 'view',
                                icon: <Eye className="w-4 h-4" />,
                                label: 'View Details',
                                onClick: () => router.push(`/daily-closure/${record.id}`)
                            },
                            ...(record.status === 'submitted' ? [
                                {
                                    key: 'approve',
                                    icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
                                    label: 'Approve',
                                    onClick: () => {
                                        Modal.confirm({
                                            title: 'Approve Daily Closure?',
                                            content: 'Are you sure you want to approve this financial record?',
                                            onOk: async () => {
                                                await handleVerifyClosure('verified', record.id);
                                                fetchHistory();
                                            },
                                            okText: 'Yes, Approve',
                                            centered: true,
                                        });
                                    }
                                },
                                {
                                    key: 'reject',
                                    icon: <XCircle className="w-4 h-4 text-rose-500" />,
                                    label: 'Reject',
                                    danger: true,
                                    onClick: () => {
                                        Modal.confirm({
                                            title: 'Reject Submission?',
                                            content: 'This will send the record back for correction.',
                                            onOk: async () => {
                                                await handleVerifyClosure('rejected', record.id);
                                                fetchHistory();
                                            },
                                            okText: 'Reject',
                                            okButtonProps: { danger: true },
                                            centered: true,
                                        });
                                    }
                                }
                            ] : [])
                        ]
                    }}
                    trigger={['click']}
                >
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                    </Button>
                </Dropdown>
            )
        }
    ];

    const renderCurrentClosure = () => {
        if (!closure) {
            return (
                <Card className="border-dashed border-2 bg-slate-50/50 overflow-hidden mt-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Stats Grid */}
                    <dl className="mx-auto grid grid-cols-1 gap-px bg-slate-200 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2 lg:grid-cols-4 shadow-sm w-full mb-8">
                        {[
                            { label: 'Total Orders', value: closure.total_orders, icon: Receipt, textColor: 'text-primary-color' },
                            { label: 'Total Items', value: closure.total_items, icon: Calculator, textColor: 'text-purple-500' },
                            { label: 'Customers', value: closure.total_customers, icon: FileText, textColor: 'text-primary-color' },
                            { label: 'Net Sales', value: `₵${closure.net_sales.toFixed(2)}`, icon: Banknote, textColor: 'text-emerald-500' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-8 sm:px-6 xl:px-8"
                            >
                                <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <stat.icon className={cn("size-5", stat.textColor)} />
                                    {stat.label}
                                </dt>
                                <dd className="w-full flex-none text-3xl font-bold tracking-tight text-slate-900 mt-2">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/* Detailed Breakdown */}
                    <Card className="border-0 shadow-xl overflow-hidden rounded-2xl">
                        <div className="p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-primary-color" />
                                Financial Reconciliation
                            </h3>
                        </div>
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

                                        {(status === 'submitted' || status === 'verified' || status === 'rejected' || status === 'discrepancy') && (
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
                        if (status === 'submitted' || status === 'discrepancy') {
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
                                                    onOk: async () => {
                                                        await handleVerifyClosure('verified');
                                                        fetchHistory();
                                                    },
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
                                                    onOk: async () => {
                                                        await handleVerifyClosure('rejected');
                                                        fetchHistory();
                                                    },
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
                                <Card className="rounded-3xl border-primary/20 bg-primary/5">
                                    <CardContent className="pt-6 text-center space-y-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <RefreshCcw className="w-6 h-6 text-primary-color" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary-color">Actively Trading</h4>
                                            <p className="text-sm text-slate-500 mt-1">The shop is currently trading. Awaiting end-of-day submission from the attendant.</p>
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
    };

    const renderHistory = () => (
        <Card className="border-0 shadow-xl overflow-hidden rounded-2xl mt-6">
            <div className="p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-color" />
                    Closure History
                </h3>
                <div className="flex items-center gap-2">
                    <RangePicker
                        onChange={(_, dateStrings) => {
                            setDateRange(dateStrings[0] ? [dateStrings[0], dateStrings[1]] : null);
                        }}
                        className="rounded-lg py-2 border-slate-200"
                    />
                    <Button onClick={fetchHistory} variant="outline" size="icon" className="h-[38px] w-[38px] rounded-lg border-slate-200 hover:bg-slate-50" disabled={loadingHistory}>
                        <RefreshCcw className={cn("h-4 w-4 text-slate-500", loadingHistory && "animate-spin")} />
                    </Button>
                </div>
            </div>
            <CardContent className="p-0">
                <Table
                    columns={columns}
                    dataSource={history}
                    rowKey="id"
                    loading={loadingHistory}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    className="custom-table whitespace-nowrap"
                />
            </CardContent>
        </Card>
    );

    return (
        <div className="admin-closure-tabs">
            <Tabs
                defaultActiveKey="current"
                size="large"
                className="text-primary [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-tab]:text-base [&_.ant-tabs-tab-active]:font-semibold"
                items={[
                    { key: 'current', label: 'Current Reconciliation', children: renderCurrentClosure() },
                    { key: 'history', label: 'Closure History', children: renderHistory() }
                ]}
            />
        </div>
    );
}
