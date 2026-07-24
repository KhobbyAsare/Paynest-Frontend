"use client";

import { useCallback, useEffect, useState } from "react";
import {
    CheckCircle2, ExternalLink, ImageOff, Loader2, Pencil, Trash2, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { DecideExpense, DeleteExpense, GetExpenseById } from "@/(api-handlers)/expensesHandler";
import { ExpenseCategoryResponse, ExpenseResponse } from "@/interfaces/expenses";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { StatusPill } from "@/components/(shared-components)/StatusPill";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingAction = "approve" | "reject" | "delete" | null;

interface ExpenseDetailDialogProps {
    expenseId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged?: () => void;
    onEdit: (expense: ExpenseResponse) => void;
    categories: ExpenseCategoryResponse[];
    shops: OrganizationShopResponse[];
}

export default function ExpenseDetailDialog({
    expenseId,
    open,
    onOpenChange,
    onChanged,
    onEdit,
    categories,
    shops,
}: Readonly<ExpenseDetailDialogProps>) {
    const fmt = useCurrency();
    const { user } = useAuthStore();
    const role = (user?.role || "attendant").toLowerCase();
    const canDecide = role === "manager" || role === "admin" || role === "superadmin";

    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<ExpenseResponse | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!expenseId) return;
        setLoading(true);
        try {
            const data = await GetExpenseById(expenseId);
            setDetail(data);
        } catch (error) {
            handleErrorMessage(error, "Failed to load expense details");
        } finally {
            setLoading(false);
        }
    }, [expenseId]);

    useEffect(() => {
        if (open && expenseId) {
            setRejectionReason("");
            fetchDetail();
        }
    }, [open, expenseId, fetchDetail]);

    const isSubmitter = detail?.submitted_by === user?.id;
    const canEditDelete = detail?.status === "pending" && (isSubmitter || canDecide);
    const canApproveReject = detail?.status === "pending" && canDecide;

    const categoryName = (id: number) => categories.find((c) => c.id === id)?.name || `Category #${id}`;
    const shopName = (id: number | null) => {
        if (id == null) return "Org-wide";
        return shops.find((s) => s.id === id)?.name || `Shop #${id}`;
    };
    const actorLabel = (id: number) => (id === user?.id ? "you" : `User #${id}`);

    const handleConfirm = async () => {
        if (!detail || !pendingAction) return;
        setActionLoading(true);
        try {
            if (pendingAction === "approve") {
                const updated = await DecideExpense(detail.id, { approved: true });
                setDetail(updated);
                toast.success(`Expense ${updated.expense_number} approved.`);
            } else if (pendingAction === "reject") {
                const updated = await DecideExpense(detail.id, {
                    approved: false,
                    rejection_reason: rejectionReason.trim(),
                });
                setDetail(updated);
                toast.success(`Expense ${updated.expense_number} rejected.`);
            } else if (pendingAction === "delete") {
                await DeleteExpense(detail.id);
                toast.success("Expense deleted.");
                onOpenChange(false);
            }
            onChanged?.();
        } catch (error) {
            handleErrorMessage(error, "Failed to update expense");
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex flex-wrap items-center gap-2">
                            {detail ? `Expense ${detail.expense_number}` : "Expense Details"}
                            {detail && <StatusPill status={detail.status} />}
                        </DialogTitle>
                        <DialogDescription>
                            {detail && `Submitted ${format(new Date(detail.submitted_at), "MMM d, yyyy · HH:mm")}`}
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="space-y-3 py-2">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : !detail ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <p className="text-muted-foreground text-sm">Expense not found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <p className="text-muted-foreground text-sm">
                                Submitted by {actorLabel(detail.submitted_by)}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground text-xs">Amount</p>
                                    <p className="text-foreground text-lg font-bold">{fmt(detail.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Date</p>
                                    <p className="text-foreground font-medium">
                                        {format(new Date(detail.expense_date), "MMM d, yyyy")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Category</p>
                                    <p className="text-foreground font-medium">{categoryName(detail.category_id)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Shop</p>
                                    <p className="text-foreground font-medium">{shopName(detail.shop_id)}</p>
                                </div>
                                {detail.vendor_name && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Vendor</p>
                                        <p className="text-foreground font-medium">{detail.vendor_name}</p>
                                    </div>
                                )}
                            </div>

                            {detail.description && (
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Description: </span>{detail.description}
                                </p>
                            )}
                            {detail.notes && (
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Notes: </span>{detail.notes}
                                </p>
                            )}

                            <div>
                                <p className="text-muted-foreground mb-1.5 text-xs">Receipt</p>
                                {detail.receipt_url ? (
                                    <a
                                        href={detail.receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-border flex items-center gap-3 rounded-lg border p-2"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={detail.receipt_url} alt="Receipt" className="size-14 rounded object-cover" />
                                        <span className="text-primary flex items-center gap-1 text-sm">
                                            View full photo <ExternalLink className="size-3.5" />
                                        </span>
                                    </a>
                                ) : (
                                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                        <ImageOff className="size-4" /> No receipt attached
                                    </div>
                                )}
                            </div>

                            {detail.status === "rejected" && detail.rejection_reason && (
                                <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                                    <span className="font-medium">Rejection reason: </span>{detail.rejection_reason}
                                </p>
                            )}

                            {(canApproveReject || canEditDelete) && <Separator />}

                            {canApproveReject && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            className="bg-success text-success-foreground hover:bg-success/90"
                                            onClick={() => setPendingAction("approve")}
                                        >
                                            <CheckCircle2 className="mr-2 size-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                            onClick={() => setPendingAction("reject")}
                                        >
                                            <XCircle className="mr-2 size-4" />
                                            Reject
                                        </Button>
                                    </div>
                                    <div>
                                        <Label className="mb-1.5 text-xs">Rejection reason (required to reject)</Label>
                                        <Textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Why this expense is being rejected"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}

                            {canEditDelete && (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => onEdit(detail)}>
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                        onClick={() => setPendingAction("delete")}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === "approve" && "Approve Expense"}
                            {pendingAction === "reject" && "Reject Expense"}
                            {pendingAction === "delete" && "Delete Expense"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === "approve" &&
                                "This counts the expense toward net profit immediately."}
                            {pendingAction === "reject" &&
                                "This closes the expense with no financial effect."}
                            {pendingAction === "delete" &&
                                "This permanently deletes the pending expense. This cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Back</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn((pendingAction === "reject" || pendingAction === "delete") && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                            onClick={handleConfirm}
                            disabled={actionLoading || (pendingAction === "reject" && !rejectionReason.trim())}
                        >
                            {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {pendingAction === "approve" && "Yes, Approve"}
                            {pendingAction === "reject" && "Yes, Reject"}
                            {pendingAction === "delete" && "Yes, Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
