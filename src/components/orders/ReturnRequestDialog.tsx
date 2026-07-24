"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PackageX, RotateCcw } from "lucide-react";
import { CreateReturn } from "@/(api-handlers)/returnsHandler";
import { OrderWalkInsResponse } from "@/interfaces/orders_walkins";
import { ProductResponse } from "@/interfaces/products";
import { CreateReturnItemInput, ReturnReason, RETURN_REASON_LABELS } from "@/interfaces/returns";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

// Order-item shape as embedded on OrderWalkInsResponse.items — the interface
// types this field as `[]`, but the API actually returns these fields (per
// the returns backend contract: order_item_id / quantity / quantity_cancelled
// all come from GET /orders/{id} → items[]).
interface OrderLineItem {
    id: number;
    product_id: number;
    quantity: number;
    quantity_cancelled?: number;
    notes?: string;
}

interface EligibleItem extends OrderLineItem {
    available: number;
}

interface LineState {
    checked: boolean;
    quantity: number;
    reason: ReturnReason;
    restockOverride: "auto" | "true" | "false";
}

interface ReturnRequestDialogProps {
    order: OrderWalkInsResponse;
    products: Record<number, ProductResponse>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function ReturnRequestDialog({
    order,
    products,
    open,
    onOpenChange,
    onSuccess,
}: Readonly<ReturnRequestDialogProps>) {
    const fmt = useCurrency();
    const [submitting, setSubmitting] = useState(false);
    const [lines, setLines] = useState<Record<number, LineState>>({});
    const [notes, setNotes] = useState("");

    const items: EligibleItem[] = useMemo(() => {
        const raw = ((order.items as unknown as OrderLineItem[]) || []);
        return raw
            .map((it) => ({ ...it, available: it.quantity - (it.quantity_cancelled || 0) }))
            .filter((it) => it.available > 0);
    }, [order.items]);

    useEffect(() => {
        if (open) {
            setNotes("");
            setLines(
                Object.fromEntries(
                    items.map((it) => [
                        it.id,
                        { checked: false, quantity: 1, reason: "customer_changed_mind" as ReturnReason, restockOverride: "auto" as const },
                    ]),
                ),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const updateLine = (id: number, patch: Partial<LineState>) => {
        setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const handleSubmit = async () => {
        const selected = items.filter((it) => lines[it.id]?.checked);
        if (selected.length === 0) {
            toast.error("Select at least one item to return");
            return;
        }

        const payloadItems: CreateReturnItemInput[] = selected.map((it) => {
            const line = lines[it.id];
            const input: CreateReturnItemInput = {
                order_item_id: it.id,
                quantity_returned: line.quantity,
                reason: line.reason,
            };
            if (line.restockOverride !== "auto") {
                input.restock = line.restockOverride === "true";
            }
            return input;
        });

        setSubmitting(true);
        try {
            const res = await CreateReturn({
                order_id: order.id,
                notes: notes.trim() || undefined,
                items: payloadItems,
            });
            toast.success(`Return ${res.return_number} submitted, awaiting manager approval.`);
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            handleErrorMessage(error, "Failed to submit return request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="size-5" />
                        Request Return / Refund
                    </DialogTitle>
                    <DialogDescription>
                        Select the items and quantities the customer is returning.
                    </DialogDescription>
                </DialogHeader>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                            <PackageX className="text-muted-foreground size-6" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            No items on this order are eligible for return.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {items.map((item) => {
                            const line = lines[item.id];
                            if (!line) return null;
                            const product = products[item.product_id];
                            return (
                                <div
                                    key={item.id}
                                    className="border-border flex flex-col gap-3 rounded-lg border p-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={line.checked}
                                            onCheckedChange={(v) => updateLine(item.id, { checked: !!v })}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p className="text-foreground font-medium">
                                                {product?.name || `Product #${item.product_id}`}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {product?.sku && `SKU: ${product.sku} · `}
                                                {fmt(product?.selling_price || 0)} each ·{" "}
                                                {item.available} available to return
                                            </p>
                                        </div>
                                    </div>

                                    {line.checked && (
                                        <div className="grid grid-cols-1 gap-3 pl-7 sm:grid-cols-3">
                                            <div>
                                                <Label className="mb-1.5 text-xs">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={item.available}
                                                    value={line.quantity}
                                                    onChange={(e) => {
                                                        const v = Math.min(
                                                            item.available,
                                                            Math.max(1, Number(e.target.value) || 1),
                                                        );
                                                        updateLine(item.id, { quantity: v });
                                                    }}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1.5 text-xs">Reason</Label>
                                                <Select
                                                    value={line.reason}
                                                    onValueChange={(v) => updateLine(item.id, { reason: v as ReturnReason })}
                                                >
                                                    <SelectTrigger className="h-9 w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
                                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="mb-1.5 text-xs">Restock</Label>
                                                <Select
                                                    value={line.restockOverride}
                                                    onValueChange={(v) => updateLine(item.id, { restockOverride: v as LineState["restockOverride"] })}
                                                >
                                                    <SelectTrigger className="h-9 w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="auto">Default</SelectItem>
                                                        <SelectItem value="true">Restock</SelectItem>
                                                        <SelectItem value="false">Don&apos;t restock</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div>
                            <Label className="mb-1.5 text-xs">Notes (optional)</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Customer returned unopened item"
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || items.length === 0}>
                        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
