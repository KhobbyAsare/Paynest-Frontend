/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Banknote,
    RefreshCcw,
    Plus,
    X,
    AlertCircle,
    CheckCircle,
    Calendar,
    Clock,
    Building2,
    Wallet,
    FileText,
    Save,
} from "lucide-react";
import { useAuthStore } from "@/(zustand-store)/authStore";
import {
    CreateDailyClosure,
    GetCurrentClosure,
    SubmitDailyClosure,
    VerifyDailyClosure
} from "@/(api-handlers)/dailyClosureHandler";
import { getOrganizationShops } from "@/(api-handlers)/organizationShopsHandler";
import { DailyClosureResponse } from "@/interfaces/dailyClosure";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, theme, Select, Space, Typography, Divider } from "antd";
import toast from "react-hot-toast";
import PageHeader from "@/components/(shared-components)/PageHeader";
import { motion } from "framer-motion";
import { format } from "date-fns";

import AttendantView from "./views/AttendantView";
import AdminView from "./views/AdminView";

const { Text } = Typography;

export default function DailyClosurePage() {
    const { user } = useAuthStore();
    const [closure, setClosure] = useState<DailyClosureResponse | null>(null);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { token } = theme.useToken();

    // Form states
    const [openingBalance, setOpeningBalance] = useState<string>("");
    const [openingNotes, setOpeningNotes] = useState<string>("");
    const [actualCash, setActualCash] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [discrepancyReason, setDiscrepancyReason] = useState<string>("");

    const role = (user?.role || "attendant").toLowerCase();
    const isAdmin = role === 'admin';
    const isInternalUser = role === 'attendant' || role === 'manager';

    // Determine the active shop ID to work with
    const activeShopId = selectedShopId || user?.employee_profile?.shop_id;

    const fetchShops = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const data = await getOrganizationShops();
            setShops(data);
            // If user has a default shop in their profile, select it
            if (user?.employee_profile?.shop_id) {
                setSelectedShopId(user.employee_profile.shop_id);
            } else if (data.length > 0) {
                // Otherwise select the first shop
                setSelectedShopId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch shops:", error);
            toast.error("Failed to load shops");
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, user?.employee_profile?.shop_id]);

    useEffect(() => {
        if (isAdmin) {
            fetchShops();
        } else if (user?.employee_profile?.shop_id) {
            setSelectedShopId(user.employee_profile.shop_id);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [isAdmin, fetchShops, user?.employee_profile?.shop_id]);

    const fetchCurrentClosure = useCallback(async () => {
        if (!activeShopId) {
            setClosure(null);
            return;
        }

        setIsLoading(true);
        try {
            const data = await GetCurrentClosure(activeShopId);
            setClosure(data);
            if (data) {
                setActualCash(data.actual_cash?.toString() || "");
                setNotes(data.notes || "");
                setDiscrepancyReason(data.discrepancy_reason || "");
            } else {
                setClosure(null);
                setActualCash("");
                setNotes("");
                setDiscrepancyReason("");
            }
        } catch (error) {
            console.error("Failed to fetch closure:", error);
            setClosure(null);
            setActualCash("");
            setNotes("");
            setDiscrepancyReason("");
        } finally {
            setIsLoading(false);
        }
    }, [activeShopId]);

    useEffect(() => {
        if (activeShopId) {
            fetchCurrentClosure();
        }
    }, [activeShopId, fetchCurrentClosure]);

    const handleOpenClosure = async () => {
        if (!activeShopId) {
            toast.error("No shop selected. Please select a shop first.");
            return;
        }

        if (!openingBalance || parseFloat(openingBalance) < 0) {
            toast.error("Please enter a valid opening balance");
            return;
        }

        setIsActionLoading(true);
        try {
            await CreateDailyClosure({
                shop_id: activeShopId,
                opening_balance: Number.parseFloat(openingBalance) || 0,
                notes: openingNotes,
                closure_date: new Date().toISOString().split('T')[0]
            });
            toast.success("Daily closure opened successfully");
            setOpeningBalance("");
            setOpeningNotes("");
            setIsModalVisible(false);
            await fetchCurrentClosure();
        } catch (error) {
            toast.error("Failed to open daily closure");
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSubmitClosure = async () => {
        if (!closure) return;
        if (!actualCash) {
            toast.error("Please enter actual cash amount");
            return;
        }

        setIsActionLoading(true);
        try {
            await SubmitDailyClosure(closure.id, {
                actual_cash: Number.parseFloat(actualCash),
                notes: notes
            });
            toast.success("Daily closure submitted for verification");
            await fetchCurrentClosure();
        } catch (error) {
            toast.error("Failed to submit daily closure");
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleVerifyClosure = async (status: 'verified' | 'rejected', closureId?: number) => {
        const id = closureId ?? closure?.id;
        if (!id) return;

        setIsActionLoading(true);
        try {
            await VerifyDailyClosure(id, {
                status: status,
                discrepancy_reason: discrepancyReason
            });
            toast.success(`Daily closure ${status} successfully`);
            await fetchCurrentClosure();
        } catch (error) {
            toast.error(`Failed to ${status} daily closure`);
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { color: string, icon: any, label: string }> = {
            opened: { color: 'bg-primary/10 text-primary-color border-primary/20', icon: Clock, label: 'Opened' },
            open: { color: 'bg-primary/10 text-primary-color border-primary/20', icon: Clock, label: 'Opened' },
            submitted: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, label: 'Pending Verification' },
            verified: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Verified' },
            rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle, label: 'Rejected' },
            discrepancy: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, label: 'Pending Review (Discrepancy)' },
        };

        const statusKey = status.toLowerCase();
        return config[statusKey] || config.opened;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
                <p className="text-slate-500 font-medium">Loading daily closure data...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 bg-linear-to-br from-slate-50 via-white to-slate-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader
                    title="Daily Closure"
                    description="Manage and track your shop's daily financial reconciliation"
                />

                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <Select
                            placeholder="Select Shop"
                            className="w-[220px] h-11"
                            value={selectedShopId}
                            onChange={(value) => setSelectedShopId(value)}
                            suffixIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                            style={{ borderRadius: '6px' }}
                        >
                            {shops.map((shop) => (
                                <Select.Option key={shop.id} value={shop.id}>
                                    <Space>
                                        <Building2 className="w-4 h-4" />
                                        {shop.name}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    )}

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={fetchCurrentClosure}
                        disabled={isLoading || !activeShopId}
                        className="rounded-md h-11 border-slate-200 hover:border-slate-300"
                    >
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                </div>
            </div>

            {/* Active Closure Banner */}
            {closure && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-md">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Closure</p>
                            <p className="font-bold text-slate-800">{closure.closure_number}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(closure.closure_date), 'MMM d, yyyy')}</span>
                        </div>
                    </div>

                    {(() => {
                        const status = getStatusBadge(closure.status);
                        const StatusIcon = status.icon;
                        return (
                            <Badge className={`rounded-full px-4 py-1.5 ${status.color} flex items-center gap-1.5`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {status.label}
                            </Badge>
                        );
                    })()}
                </motion.div>
            )}

            {/* Main Views */}
            {isInternalUser ? (
                <AttendantView
                    closure={closure}
                    isActionLoading={isActionLoading}
                    handleSubmitClosure={handleSubmitClosure}
                    actualCash={actualCash}
                    setActualCash={setActualCash}
                    notes={notes}
                    setNotes={setNotes}
                    onOpenModal={() => setIsModalVisible(true)}
                />
            ) : isAdmin ? (
                <AdminView
                    closure={closure}
                    isActionLoading={isActionLoading}
                    handleVerifyClosure={handleVerifyClosure}
                    discrepancyReason={discrepancyReason}
                    setDiscrepancyReason={setDiscrepancyReason}
                    activeShopId={activeShopId || undefined}
                />
            ) : (
                <Card className="p-12 text-center border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">You do not have permission to view this page.</p>
                </Card>
            )}

            {/* Opening Modal - Redesigned with Ant Design */}
            <Modal
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={480}
                centered
                closable={false}
                modalRender={(modal) => (
                    <div className="ant-modal-custom">
                        {modal}
                    </div>
                )}
            >
                {/* Custom Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <Space size="middle" align="center">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md">
                            <Banknote className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <Text strong style={{ fontSize: '16px', color: '#1e293b' }}>
                                Open Daily Closure
                            </Text>
                            <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginTop: '2px' }}>
                                Set your opening float and notes for today
                            </Text>
                        </div>
                    </Space>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsModalVisible(false)}
                        className="rounded-full h-8 w-8 hover:bg-slate-100"
                    >
                        <X className="h-4 w-4 text-slate-400" />
                    </Button>
                </div>

                {/* Body Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* Shop Info */}
                    {shops.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Selected Shop</p>
                                    <p className="font-medium text-slate-700">
                                        {shops.find(s => s.id === activeShopId)?.name || 'Unknown Shop'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Opening Balance Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <Wallet className="w-4 h-4 text-slate-400" />
                            Opening Cash Balance
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                                ₵
                            </span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                className="pl-12 h-14 text-lg font-semibold bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-md"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Enter the initial cash amount in the register
                        </p>
                    </div>

                    {/* Opening Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <FileText className="w-4 h-4 text-slate-400" />
                            Opening Notes (Optional)
                        </label>
                        <Textarea
                            placeholder="Add any notes about shift start, float details, etc..."
                            className="min-h-[100px] bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-md resize-none p-4"
                            value={openingNotes}
                            onChange={(e) => setOpeningNotes(e.target.value)}
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-md">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(), 'h:mm a')}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-md">
                    <Button
                        variant="outline"
                        onClick={() => setIsModalVisible(false)}
                        className="rounded-md h-11 px-6 border-slate-200 hover:bg-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleOpenClosure}
                        disabled={isActionLoading || !openingBalance}
                        className="rounded-md h-11 px-8 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-200 flex items-center gap-2"
                    >
                        {isActionLoading ? (
                            <>
                                <RefreshCcw className="h-4 w-4 animate-spin" />
                                Opening...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Open Closure
                            </>
                        )}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}