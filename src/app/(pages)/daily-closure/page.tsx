"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Banknote,
    RefreshCcw,
    Plus,
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
import { Modal, theme, Select } from "antd";
import { Building2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/(shared-components)/PageHeader";

import AttendantView from "./views/AttendantView";
import AdminView from "./views/AdminView";

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
    const [openingBalance, setOpeningBalance] = useState<string>("0");
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
        setIsActionLoading(true);
        try {
            await CreateDailyClosure({
                shop_id: activeShopId,
                opening_balance: Number.parseFloat(openingBalance) || 0,
                notes: openingNotes,
                closure_date: new Date().toISOString().split('T')[0]
            });
            toast.success("Daily closure opened successfully");
            setOpeningBalance("0");
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

    const handleVerifyClosure = async (status: 'verified' | 'rejected') => {
        if (!closure) return;

        setIsActionLoading(true);
        try {
            await VerifyDailyClosure(closure.id, {
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCcw className="w-10 h-10 text-primary-color animate-spin" />
                <p className="text-slate-500 font-medium">Loading daily closure data...</p>
            </div>
        );
    }

    const renderStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'opened':
            case 'open':
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Opened</Badge>;
            case 'submitted':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending Verification</Badge>;
            case 'verified':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Verified</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };


    const modalStyles = {
        header: {
            borderRadius: token.borderRadiusLG,
            padding: token.paddingLG,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
        body: {
            padding: token.paddingLG,
        },
        footer: {
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: token.paddingLG,
        },
        content: {
            borderRadius: token.borderRadiusLG,
        },
    };

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
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
                            className="w-[220px] h-12 rounded-xl"
                            value={selectedShopId}
                            onChange={(value) => setSelectedShopId(value)}
                            suffixIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                        >
                            {shops.map((shop) => (
                                <Select.Option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </Select.Option>
                            ))}
                        </Select>
                    )}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={fetchCurrentClosure}
                        disabled={isLoading || !activeShopId}
                        className="shadow-sm hover:bg-slate-100 transition-all border-slate-200"
                    >
                        <RefreshCcw className={`h-5 w-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    {!closure && isInternalUser && (
                        <Button
                            onClick={() => setIsModalVisible(true)}
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Open Daily Closure
                        </Button>
                    )}
                </div>
            </div>

            {
                closure && (
                    <div className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Banknote className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-bold text-slate-700">Active Closure: {closure.closure_number}</span>
                        </div>
                        {renderStatusBadge(closure.status)}
                    </div>
                )
            }

            {
                isInternalUser ? (
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
                    />
                ) : (
                    <Card className="p-12 text-center">
                        <p className="text-slate-500">You do not have permission to view this page.</p>
                    </Card>
                )
            }

            {/* Opening Modal */}
            <Modal
                title={null}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={500}
                centered
                closable={false}
                styles={modalStyles}
            >
                {/* Custom Header */}
                <div style={modalStyles.header} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Open Daily Closure</h3>
                            <p className="text-xs text-slate-500 font-normal">Set your opening float and notes for today</p>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div style={modalStyles.body} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Opening Cash Balance</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₵</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                className="pl-8 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-xl font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Opening Notes</label>
                        <Textarea
                            placeholder="Shift details, float notes..."
                            className="min-h-[120px] bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl resize-none p-4"
                            value={openingNotes}
                            onChange={(e) => setOpeningNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer Content */}
                <div style={modalStyles.footer} className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setIsModalVisible(false)}
                        className="rounded-xl px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleOpenClosure}
                        disabled={isActionLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all rounded-xl px-6"
                    >
                        {isActionLoading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                        Open Daily Closure
                    </Button>
                </div>
            </Modal>
        </div >
    );
}
