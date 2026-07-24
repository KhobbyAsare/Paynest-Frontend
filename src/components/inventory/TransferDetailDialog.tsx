"use client";

import { useCallback, useEffect, useState } from "react";
import {
    CheckCircle2, ClipboardCheck, Clock, Loader2, PackageX, Truck, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/(zustand-store)/authStore";
import {
    CancelTransfer, DecideTransfer, GetTransferById, ReceiveTransfer, ShipTransfer,
} from "@/(api-handlers)/inventoryTransfersHandler";
import { GetProductByID } from "@/(api-handlers)/productsHandler";
import { TransferResponse } from "@/interfaces/inventoryTransfers";
import { ProductResponse } from "@/interfaces/products";
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
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingAction = "approve" | "reject" | "ship" | "receive" | "cancel" | null;

interface StageConfig {
    key: string;
    label: string;
    icon: typeof Clock;
    by: number | null;
    at: string | null;
}

interface TransferDetailDialogProps {
    transferId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged?: () => void;
}

export default function TransferDetailDialog({
    transferId,
    open,
    onOpenChange,
    onChanged,
}: Readonly<TransferDetailDialogProps>) {
    const { user } = useAuthStore();
    const role = (user?.role || "attendant").toLowerCase();
    const canDecide = role === "manager" || role === "admin" || role === "superadmin";

    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<TransferResponse | null>(null);
    const [products, setProducts] = useState<Record<number, ProductResponse>>({});
    const [rejectionReason, setRejectionReason] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!transferId) return;
        setLoading(true);
        try {
            const data = await GetTransferById(transferId);
            setDetail(data);

            const ids = Array.from(new Set(
                data.items.flatMap((it) => [it.source_product_id, it.destination_product_id]),
            ));
            const results = await Promise.allSettled(ids.map((id) => GetProductByID(id)));
            const map: Record<number, ProductResponse> = {};
            results.forEach((res, idx) => {
                if (res.status === "fulfilled") map[ids[idx]] = res.value;
            });
            setProducts(map);
        } catch (error) {
            handleErrorMessage(error, "Failed to load transfer details");
        } finally {
            setLoading(false);
        }
    }, [transferId]);

    useEffect(() => {
        if (open && transferId) {
            setRejectionReason("");
            fetchDetail();
        }
    }, [open, transferId, fetchDetail]);

    const isRequester = detail?.requested_by === user?.id;
    const canCancel = detail?.status === "requested" && (isRequester || canDecide);
    const canApproveReject = detail?.status === "requested" && canDecide;
    const canShip = detail?.status === "approved";
    const canReceive = detail?.status === "shipped";
    const isTerminalBranch = detail?.status === "rejected" || detail?.status === "cancelled";

    const handleConfirm = async () => {
        if (!detail || !pendingAction) return;
        setActionLoading(true);
        try {
            if (pendingAction === "approve") {
                const updated = await DecideTransfer(detail.id, { approved: true });
                setDetail(updated);
                toast.success(`Transfer ${updated.transfer_number} approved.`);
            } else if (pendingAction === "reject") {
                const updated = await DecideTransfer(detail.id, {
                    approved: false,
                    rejection_reason: rejectionReason.trim(),
                });
                setDetail(updated);
                toast.success(`Transfer ${updated.transfer_number} rejected.`);
            } else if (pendingAction === "ship") {
                const updated = await ShipTransfer(detail.id);
                setDetail(updated);
                toast.success(`Transfer ${updated.transfer_number} marked as shipped.`);
            } else if (pendingAction === "receive") {
                const updated = await ReceiveTransfer(detail.id);
                setDetail(updated);
                toast.success(`Transfer ${updated.transfer_number} received.`);
            } else if (pendingAction === "cancel") {
                await CancelTransfer(detail.id);
                toast.success("Transfer request cancelled.");
                onOpenChange(false);
            }
            onChanged?.();
        } catch (error) {
            handleErrorMessage(error, "Failed to update transfer");
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    const stages: StageConfig[] = detail ? [
        { key: "requested", label: "Requested", icon: Clock, by: detail.requested_by, at: detail.requested_at },
        { key: "approved", label: "Approved", icon: ClipboardCheck, by: detail.approved_by, at: detail.approved_at },
        { key: "shipped", label: "Shipped", icon: Truck, by: detail.shipped_by, at: detail.shipped_at },
        { key: "received", label: "Received", icon: CheckCircle2, by: detail.received_by, at: detail.received_at },
    ] : [];
    const lastDoneIdx = stages.reduce((acc, s, idx) => (s.at ? idx : acc), -1);

    const actorLabel = (id: number | null) => {
        if (id == null) return null;
        return id === user?.id ? "you" : `User #${id}`;
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex flex-wrap items-center gap-2">
                            {detail ? `Transfer ${detail.transfer_number}` : "Transfer Details"}
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
                            <p className="text-muted-foreground text-sm">Transfer not found.</p>
                        </div>
                    ) : (
                        <div className="space-y-5 py-2">
                            <p className="text-muted-foreground text-sm">
                                Requested by {actorLabel(detail.requested_by)}
                            </p>

                            {/* Timeline */}
                            <div className="relative pt-2">
                                <div className="bg-border absolute left-0 top-6 h-0.5 w-full" />
                                <div className="relative flex justify-between">
                                    {stages.map((stage, idx) => {
                                        const done = !!stage.at;
                                        const isCurrent = done && !isTerminalBranch && idx === lastDoneIdx;
                                        return (
                                            <div key={stage.key} className="flex flex-col items-center">
                                                <div className={cn(
                                                    "relative z-10 flex size-9 items-center justify-center rounded-full border-4 bg-background",
                                                    isCurrent ? "border-primary" : done ? "border-success" : "border-border",
                                                )}>
                                                    <stage.icon className={cn(
                                                        "size-4",
                                                        isCurrent ? "text-primary" : done ? "text-success" : "text-muted-foreground/40",
                                                    )} />
                                                </div>
                                                <span className={cn(
                                                    "mt-2 text-xs font-medium",
                                                    done ? "text-foreground" : "text-muted-foreground",
                                                )}>
                                                    {stage.label}
                                                </span>
                                                {stage.at && (
                                                    <div className="mt-1 flex flex-col items-center">
                                                        <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                                                            {format(new Date(stage.at), "MMM d, HH:mm")}
                                                        </span>
                                                        <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                                                            {actorLabel(stage.by)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {detail.status === "rejected" && detail.rejection_reason && (
                                <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                                    <span className="font-medium">Rejection reason: </span>{detail.rejection_reason}
                                </p>
                            )}
                            {detail.status === "cancelled" && (
                                <p className="border-border bg-muted text-muted-foreground rounded-lg border p-3 text-sm">
                                    This transfer request was cancelled before it was approved.
                                </p>
                            )}

                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Source Product</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead>Destination Product</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.items.map((item) => {
                                            const source = products[item.source_product_id];
                                            const destination = products[item.destination_product_id];
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <p className="font-medium">{source?.name || `Product #${item.source_product_id}`}</p>
                                                        {source?.sku && <p className="text-muted-foreground text-xs">SKU: {source.sku}</p>}
                                                    </TableCell>
                                                    <TableCell className="text-center">×{item.quantity}</TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">{destination?.name || `Product #${item.destination_product_id}`}</p>
                                                        {destination?.sku && <p className="text-muted-foreground text-xs">SKU: {destination.sku}</p>}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {detail.notes && (
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Notes: </span>{detail.notes}
                                </p>
                            )}

                            {(canApproveReject || canCancel || canShip || canReceive) && <Separator />}

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
                                            placeholder="Why this transfer is being rejected"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}

                            {canShip && (
                                <Button className="w-full" onClick={() => setPendingAction("ship")}>
                                    <Truck className="mr-2 size-4" />
                                    Mark as Shipped
                                </Button>
                            )}

                            {canReceive && (
                                <Button className="w-full" onClick={() => setPendingAction("receive")}>
                                    <CheckCircle2 className="mr-2 size-4" />
                                    Mark as Received
                                </Button>
                            )}

                            {canCancel && (
                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground w-full"
                                    onClick={() => setPendingAction("cancel")}
                                >
                                    Cancel Transfer Request
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === "approve" && "Approve Transfer"}
                            {pendingAction === "reject" && "Reject Transfer"}
                            {pendingAction === "ship" && "Mark as Shipped"}
                            {pendingAction === "receive" && "Mark as Received"}
                            {pendingAction === "cancel" && "Cancel Transfer Request"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === "approve" &&
                                "This authorizes the transfer to be shipped. Stock is not moved yet."}
                            {pendingAction === "reject" &&
                                "This will close the transfer request without moving any stock."}
                            {pendingAction === "ship" &&
                                "This deducts the requested quantities from the source shop's stock right now. Make sure the goods have physically left."}
                            {pendingAction === "receive" &&
                                "This adds the shipped quantities to the destination shop's stock right now. Make sure the goods have physically arrived."}
                            {pendingAction === "cancel" &&
                                "This cancels the pending transfer request. No stock has moved yet."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Back</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(pendingAction === "reject" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                            onClick={handleConfirm}
                            disabled={actionLoading || (pendingAction === "reject" && !rejectionReason.trim())}
                        >
                            {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {pendingAction === "approve" && "Yes, Approve"}
                            {pendingAction === "reject" && "Yes, Reject"}
                            {pendingAction === "ship" && "Yes, Ship"}
                            {pendingAction === "receive" && "Yes, Receive"}
                            {pendingAction === "cancel" && "Yes, Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
