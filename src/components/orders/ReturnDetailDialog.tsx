"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, PackageX, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { DecideReturn, CancelReturn, GetReturnById } from "@/(api-handlers)/returnsHandler";
import { RETURN_REASON_LABELS, ReturnDecisionRequest, ReturnResponse, RefundMethod } from "@/interfaces/returns";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingAction = "approve" | "reject" | "withdraw" | null;

interface ReturnDetailDialogProps {
    returnId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDecided?: () => void;
}

export default function ReturnDetailDialog({
    returnId,
    open,
    onOpenChange,
    onDecided,
}: Readonly<ReturnDetailDialogProps>) {
    const fmt = useCurrency();
    const { user } = useAuthStore();
    const role = (user?.role || "attendant").toLowerCase();
    const canDecide = role === "manager" || role === "admin" || role === "superadmin";

    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<ReturnResponse | null>(null);
    const [refundMethod, setRefundMethod] = useState<RefundMethod | "auto">("auto");
    const [rejectionReason, setRejectionReason] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!returnId) return;
        setLoading(true);
        try {
            const data = await GetReturnById(returnId);
            setDetail(data);
        } catch (error) {
            handleErrorMessage(error, "Failed to load return details");
        } finally {
            setLoading(false);
        }
    }, [returnId]);

    useEffect(() => {
        if (open && returnId) {
            setRefundMethod("auto");
            setRejectionReason("");
            fetchDetail();
        }
    }, [open, returnId, fetchDetail]);

    const isRequester = detail?.requested_by === user?.id;
    const canWithdraw = detail?.status === "requested" && (isRequester || canDecide);

    const handleConfirm = async () => {
        if (!detail || !pendingAction) return;
        setActionLoading(true);
        try {
            if (pendingAction === "approve") {
                const payload: ReturnDecisionRequest = { approved: true };
                if (refundMethod !== "auto") payload.refund_method = refundMethod;
                const updated = await DecideReturn(detail.id, payload);
                setDetail(updated);
                toast.success(`Return ${updated.return_number} approved.`);
            } else if (pendingAction === "reject") {
                const updated = await DecideReturn(detail.id, {
                    approved: false,
                    rejection_reason: rejectionReason.trim(),
                });
                setDetail(updated);
                toast.success(`Return ${updated.return_number} rejected.`);
            } else if (pendingAction === "withdraw") {
                await CancelReturn(detail.id);
                toast.success("Return request withdrawn.");
                onOpenChange(false);
            }
            onDecided?.();
        } catch (error) {
            handleErrorMessage(error, "Failed to update return");
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex flex-wrap items-center gap-2">
                            {detail ? `Return ${detail.return_number}` : "Return Details"}
                            {detail && <StatusPill status={detail.status} />}
                        </DialogTitle>
                        <DialogDescription>
                            {detail && `Requested ${format(new Date(detail.requested_at), "MMM d, yyyy · HH:mm")}`}
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="space-y-3 py-2">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : !detail ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <PackageX className="text-muted-foreground size-8" />
                            <p className="text-muted-foreground text-sm">Return not found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <p className="text-muted-foreground text-sm">
                                Requested by {isRequester ? "you" : `User #${detail.requested_by}`}
                            </p>

                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead className="text-center">Restock</TableHead>
                                            <TableHead className="text-right">Refund</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>Product #{item.product_id}</TableCell>
                                                <TableCell className="text-center">×{item.quantity_returned}</TableCell>
                                                <TableCell className="text-sm">{RETURN_REASON_LABELS[item.reason]}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="rounded-full">
                                                        {item.restock ? "Yes" : "No"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {fmt(item.total_amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {detail.notes && (
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Notes: </span>{detail.notes}
                                </p>
                            )}

                            {detail.status === "rejected" && detail.rejection_reason && (
                                <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                                    <span className="font-medium">Rejection reason: </span>{detail.rejection_reason}
                                </p>
                            )}

                            <div className="ml-auto w-full max-w-xs space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{fmt(detail.refund_subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{fmt(detail.refund_tax_amount)}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between font-semibold">
                                    <span>Refund Total</span>
                                    <span className="text-lg">{fmt(detail.refund_total)}</span>
                                </div>
                            </div>

                            {detail.status === "requested" && (
                                <>
                                    <Separator />
                                    {canDecide && (
                                        <div className="space-y-4">
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Label className="mb-1.5 text-xs">Refund method (optional override)</Label>
                                                    <Select
                                                        value={refundMethod}
                                                        onValueChange={(v) => setRefundMethod(v as RefundMethod | "auto")}
                                                    >
                                                        <SelectTrigger className="h-9 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="auto">Same as original payment</SelectItem>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                                                            <SelectItem value="mobile transfer">Mobile Transfer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button
                                                    className="bg-success text-success-foreground hover:bg-success/90"
                                                    onClick={() => setPendingAction("approve")}
                                                >
                                                    <CheckCircle className="mr-2 size-4" />
                                                    Approve
                                                </Button>
                                            </div>

                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Label className="mb-1.5 text-xs">Rejection reason</Label>
                                                    <Textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Required to reject this return"
                                                        rows={2}
                                                    />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                                    disabled={!rejectionReason.trim()}
                                                    onClick={() => setPendingAction("reject")}
                                                >
                                                    <XCircle className="mr-2 size-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {canWithdraw && (
                                        <Button
                                            variant="ghost"
                                            className="text-muted-foreground w-full"
                                            onClick={() => setPendingAction("withdraw")}
                                        >
                                            Withdraw Request
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === "approve" && "Approve Return"}
                            {pendingAction === "reject" && "Reject Return"}
                            {pendingAction === "withdraw" && "Withdraw Return Request"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === "approve" &&
                                "This will restock eligible items and record a refund payment immediately. This cannot be undone."}
                            {pendingAction === "reject" &&
                                "This will close the return request without any refund or restock."}
                            {pendingAction === "withdraw" &&
                                "This will cancel the pending return request."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(pendingAction === "reject" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                            onClick={handleConfirm}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {pendingAction === "approve" && "Yes, Approve"}
                            {pendingAction === "reject" && "Yes, Reject"}
                            {pendingAction === "withdraw" && "Yes, Withdraw"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
