"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PackageX, Search, Send } from "lucide-react";
import { CreateTransfer } from "@/(api-handlers)/inventoryTransfersHandler";
import { GetProducts } from "@/(api-handlers)/productsHandler";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { ProductResponse } from "@/interfaces/products";
import { CreateTransferItemInput } from "@/interfaces/inventoryTransfers";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface LineState {
    checked: boolean;
    quantity: number;
}

interface NewTransferDialogProps {
    shops: OrganizationShopResponse[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function NewTransferDialog({
    shops,
    open,
    onOpenChange,
    onSuccess,
}: Readonly<NewTransferDialogProps>) {
    const [sourceShopId, setSourceShopId] = useState("");
    const [destinationShopId, setDestinationShopId] = useState("");
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [lines, setLines] = useState<Record<number, LineState>>({});
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setSourceShopId("");
        setDestinationShopId("");
        setProducts([]);
        setSearchTerm("");
        setLines({});
        setNotes("");
    }, [open]);

    useEffect(() => {
        if (!sourceShopId) {
            setProducts([]);
            return;
        }
        setLoadingProducts(true);
        GetProducts(Number(sourceShopId))
            .then((data) => {
                setProducts(data);
                setLines(Object.fromEntries(data.map((p) => [p.id, { checked: false, quantity: 1 }])));
            })
            .catch((error) => handleErrorMessage(error, "Failed to load source shop's products"))
            .finally(() => setLoadingProducts(false));
    }, [sourceShopId]);

    useEffect(() => {
        if (destinationShopId && destinationShopId === sourceShopId) {
            setDestinationShopId("");
        }
    }, [sourceShopId, destinationShopId]);

    const filteredProducts = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return products;
        return products.filter((p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.barcode.toLowerCase().includes(term)
        );
    }, [products, searchTerm]);

    const updateLine = (id: number, patch: Partial<LineState>) => {
        setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const handleSubmit = async () => {
        if (!sourceShopId || !destinationShopId) {
            toast.error("Select a source and destination shop");
            return;
        }
        const selected = products.filter((p) => lines[p.id]?.checked);
        if (selected.length === 0) {
            toast.error("Select at least one product to transfer");
            return;
        }

        const items: CreateTransferItemInput[] = selected.map((p) => ({
            product_id: p.id,
            quantity: lines[p.id].quantity,
        }));

        setSubmitting(true);
        try {
            const res = await CreateTransfer({
                source_shop_id: Number(sourceShopId),
                destination_shop_id: Number(destinationShopId),
                notes: notes.trim() || undefined,
                items,
            });
            toast.success(`Transfer ${res.transfer_number} requested`);
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            handleErrorMessage(error, "Failed to request transfer");
        } finally {
            setSubmitting(false);
        }
    };

    const destinationOptions = shops.filter((s) => String(s.id) !== sourceShopId);
    const selectedCount = Object.values(lines).filter((l) => l.checked).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="size-5" />
                        New Transfer
                    </DialogTitle>
                    <DialogDescription>
                        Move stock of one or more products from one shop to another.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <Label className="mb-1.5 text-xs">Source Shop</Label>
                            <Select value={sourceShopId} onValueChange={setSourceShopId}>
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Select source shop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shops.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1.5 text-xs">Destination Shop</Label>
                            <Select value={destinationShopId} onValueChange={setDestinationShopId} disabled={!sourceShopId}>
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Select destination shop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {destinationOptions.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {sourceShopId && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Search products by name, SKU, or barcode…"
                                    className="h-9 pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {loadingProducts ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-8 text-center">
                                    <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                                        <PackageX className="text-muted-foreground size-6" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {products.length === 0 ? "This shop has no products." : "No products match your search."}
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                    {filteredProducts.map((product) => {
                                        const line = lines[product.id];
                                        if (!line) return null;
                                        const available = product.stock_quantity ?? 0;
                                        return (
                                            <div
                                                key={product.id}
                                                className="border-border flex items-center gap-3 rounded-lg border p-3"
                                            >
                                                <Checkbox
                                                    checked={line.checked}
                                                    disabled={available <= 0}
                                                    onCheckedChange={(v) => updateLine(product.id, { checked: !!v })}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-foreground truncate font-medium">{product.name}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        SKU: {product.sku} · {available} in stock
                                                    </p>
                                                </div>
                                                {line.checked && (
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={available}
                                                        value={line.quantity}
                                                        onChange={(e) => {
                                                            const v = Math.min(available, Math.max(1, Number(e.target.value) || 1));
                                                            updateLine(product.id, { quantity: v });
                                                        }}
                                                        className="h-9 w-20"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <Label className="mb-1.5 text-xs">Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Restocking Kumasi branch"
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !sourceShopId || !destinationShopId || selectedCount === 0}
                    >
                        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Request Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
