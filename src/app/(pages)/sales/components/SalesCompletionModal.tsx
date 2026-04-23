"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useSalesStore } from "@/(zustand-store)/salesStore";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { CreateWalkIns } from "@/(api-handlers)/orders_walkinsHandler";
import { GetAllCustomers } from "@/(api-handlers)/customersHandler";
import { CustomerResponse } from "@/interfaces/customers";
import { OrderRequest, WalkInsRequest } from "@/interfaces/orders_walkins";
import { toast } from "sonner";
import {
    CheckCircle2,
    CreditCard,
    Wallet,
    Banknote,
    User,
    ShoppingCart,
    ChevronRight,
    Loader2,
    MapPin,
    Printer,
    X,
} from "lucide-react";
import { handleErrorMessage } from "@/lib/handleErrorMessage";

interface SalesCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    subTotal: number;
    tax: number;
}

interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

interface CompletedSale {
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    isOrder: boolean;
    orgName: string;
    timestamp: Date;
}

const paymentLabel: Record<string, string> = {
    cash: "Cash",
    "bank transfer": "Bank / Card",
    "mobile transfer": "Mobile Money",
};

const fmt = (n: number) =>
    new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
    }).format(n);

export function SalesCompletionModal({
    isOpen,
    onClose,
    total,
    subTotal,
    tax,
}: Readonly<SalesCompletionModalProps>) {
    const { cart, isOrderMode, paymentMethod, setPaymentMethod, clearCart } =
        useSalesStore();
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState<CustomerResponse[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
        null,
    );
    const [deliveryAddress, setDeliveryAddress] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [completedSale, setCompletedSale] = useState<CompletedSale | null>(
        null,
    );

    const finalTotal = Math.max(0, total - discountAmount);

    useEffect(() => {
        if (isOpen && isOrderMode) {
            const fetchCustomers = async () => {
                setIsLoading(true);
                try {
                    const data = await GetAllCustomers();
                    setCustomers(data.items);
                } catch (error) {
                    console.error("Failed to fetch customers", error);
                    toast.error("Failed to load customers");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCustomers();
        }
    }, [isOpen, isOrderMode]);

    useEffect(() => {
        if (isOpen) {
            setCompletedSale(null);
            setDiscountAmount(0);
            setSelectedCustomerId(null);
            setDeliveryAddress("");
        }
    }, [isOpen]);

    const handleComplete = async () => {
        if (isOrderMode && !selectedCustomerId) {
            toast.error("Please select a customer for the order");
            return;
        }
        if (!user?.employee_profile?.shop_id) {
            toast.error("Shop information not found");
            return;
        }

        const receiptItems: ReceiptItem[] = Object.values(cart).map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.selling_price,
            lineTotal: item.product.selling_price * item.quantity,
        }));

        setIsSubmitting(true);
        try {
            const items = Object.values(cart).map((item) => ({
                product_id: item.product.id,
                quantity: item.quantity,
                notes: item.specialInstructions || "",
            }));
            const payment = {
                method: paymentMethod,
                status: "paid" as const,
                amount_paid: finalTotal,
            };

            if (isOrderMode) {
                const orderData: OrderRequest = {
                    shop_id: user.employee_profile.shop_id,
                    order_type: "sale",
                    order_status: "initiated",
                    customer_id: selectedCustomerId!,
                    items: items.map(({ product_id, quantity }) => ({
                        product_id,
                        quantity,
                    })),
                    payment,
                    delivery_amount: 0,
                    discount_amount: discountAmount,
                    is_delivered: false,
                    delivery_address: deliveryAddress || null,
                    actual_delivery_date: new Date().toISOString(),
                    expected_delivery_date: new Date().toISOString(),
                };
                await CreateWalkIns(orderData);
            } else {
                const walkInData: WalkInsRequest = {
                    shop_id: user.employee_profile.shop_id,
                    order_type: "sale",
                    order_status: "delivered",
                    customer_id: null,
                    items,
                    payment,
                    delivery_amount: 0,
                    discount_amount: discountAmount,
                    is_delivered: true,
                    delivery_address: null,
                    actual_delivery_date: null,
                    expected_delivery_date: null,
                };
                await CreateWalkIns(walkInData);
            }

            clearCart();
            setCompletedSale({
                items: receiptItems,
                subtotal: subTotal,
                tax,
                discount: discountAmount,
                total: finalTotal,
                paymentMethod,
                isOrder: isOrderMode,
                orgName: user.organization?.name || "Paynest POS",
                timestamp: new Date(),
            });
            toast.success(
                isOrderMode
                    ? "Order created successfully!"
                    : "Sale completed successfully!",
            );
        } catch (error) {
            handleErrorMessage(
                error,
                "Failed to process transaction. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        if (!completedSale) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Please allow popups to print the receipt");
            return;
        }

        const itemsHtml = completedSale.items
            .map(
                (item) => `
                    <div class="row">
                        <span class="item-name">${item.name} <span class="muted">×${item.quantity}</span></span>
                        <span class="item-price">${fmt(item.lineTotal)}</span>
                    </div>`,
            )
            .join("");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt — ${completedSale.orgName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                        padding: 20px;
                        background: white;
                        color: #0f172a;
                    }
                    .receipt { max-width: 360px; margin: 0 auto; }
                    .header { text-align: center; padding: 16px 0 20px; border-bottom: 2px dashed #cbd5e1; }
                    .org { font-size: 16px; font-weight: 700; }
                    .title { font-size: 13px; color: #64748b; margin-top: 4px; }
                    .meta { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding: 12px 0; }
                    .items { padding: 8px 0 12px; border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; }
                    .row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
                    .item-name { flex: 1; padding-right: 8px; }
                    .item-price { font-variant-numeric: tabular-nums; font-weight: 500; }
                    .muted { color: #94a3b8; }
                    .totals { padding: 10px 0; font-size: 13px; }
                    .totals .row { color: #64748b; }
                    .totals .discount { color: #059669; }
                    .grand {
                        display: flex; justify-content: space-between;
                        padding-top: 10px; margin-top: 8px;
                        border-top: 1px solid #e2e8f0;
                        font-size: 15px; font-weight: 700;
                    }
                    .grand .amount { font-variant-numeric: tabular-nums; }
                    .payment {
                        margin-top: 16px; padding: 10px;
                        background: #f8fafc; border-radius: 8px;
                        text-align: center; font-size: 12px; color: #475569;
                    }
                    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="org">${completedSale.orgName}</div>
                        <div class="title">${
                            completedSale.isOrder
                                ? "Order Receipt"
                                : "Payment Receipt"
                        }</div>
                    </div>
                    <div class="meta">
                        <span>${completedSale.timestamp.toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            },
                        )}</span>
                        <span>${completedSale.timestamp.toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" },
                        )}</span>
                    </div>
                    <div class="items">${itemsHtml}</div>
                    <div class="totals">
                        <div class="row">
                            <span>Subtotal</span>
                            <span>${fmt(completedSale.subtotal)}</span>
                        </div>
                        <div class="row">
                            <span>Tax</span>
                            <span>${fmt(completedSale.tax)}</span>
                        </div>
                        ${
                            completedSale.discount > 0
                                ? `<div class="row discount"><span>Discount</span><span>−${fmt(
                                      completedSale.discount,
                                  )}</span></div>`
                                : ""
                        }
                    </div>
                    <div class="grand">
                        <span>Total Paid</span>
                        <span class="amount">${fmt(completedSale.total)}</span>
                    </div>
                    <div class="payment">
                        Paid via ${
                            paymentLabel[completedSale.paymentMethod] ||
                            completedSale.paymentMethod
                        }
                    </div>
                    <div class="footer">Thank you for your purchase!</div>
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                        window.onafterprint = () => window.close();
                    };
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
    };

    const handleCloseReceipt = () => {
        setCompletedSale(null);
        onClose();
    };

    // ── Receipt view ──────────────────────────────────────────────────────────
    if (completedSale) {
        return (
            <Dialog open={isOpen} onOpenChange={handleCloseReceipt}>
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Receipt</DialogTitle>
                    </DialogHeader>

                    <div className="bg-success flex flex-col items-center gap-2 px-6 py-6 text-center">
                        <div className="bg-success-foreground/10 flex size-14 items-center justify-center rounded-full">
                            <CheckCircle2 className="text-success-foreground size-8" />
                        </div>
                        <div>
                            <h2 className="text-success-foreground text-lg font-bold">
                                {completedSale.isOrder
                                    ? "Order Placed"
                                    : "Payment Complete"}
                            </h2>
                            <p className="text-success-foreground/80 text-xs">
                                {completedSale.orgName}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 px-5 py-5">
                        <div className="text-muted-foreground flex justify-between text-xs">
                            <span>
                                {completedSale.timestamp.toLocaleDateString(
                                    "en-GB",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    },
                                )}
                            </span>
                            <span>
                                {completedSale.timestamp.toLocaleTimeString(
                                    "en-GB",
                                    { hour: "2-digit", minute: "2-digit" },
                                )}
                            </span>
                        </div>

                        <div className="border-border flex flex-col gap-1.5 border-y border-dashed py-3">
                            {completedSale.items.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between text-sm"
                                >
                                    <span className="text-foreground flex-1 truncate pr-2">
                                        {item.name}{" "}
                                        <span className="text-muted-foreground">
                                            ×{item.quantity}
                                        </span>
                                    </span>
                                    <span className="num-tabular text-foreground shrink-0 font-medium">
                                        {fmt(item.lineTotal)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5 text-sm">
                            <div className="text-muted-foreground flex justify-between">
                                <span>Subtotal</span>
                                <span className="num-tabular">
                                    {fmt(completedSale.subtotal)}
                                </span>
                            </div>
                            <div className="text-muted-foreground flex justify-between">
                                <span>Tax</span>
                                <span className="num-tabular">
                                    {fmt(completedSale.tax)}
                                </span>
                            </div>
                            {completedSale.discount > 0 && (
                                <div className="text-success flex justify-between">
                                    <span>Discount</span>
                                    <span className="num-tabular">
                                        −{fmt(completedSale.discount)}
                                    </span>
                                </div>
                            )}
                            <Separator className="my-1" />
                            <div className="flex items-center justify-between text-base font-bold">
                                <span className="text-foreground">
                                    Total Paid
                                </span>
                                <span className="num-tabular text-primary">
                                    {fmt(completedSale.total)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-muted text-foreground flex items-center gap-2 rounded-lg p-3 text-sm">
                            {completedSale.paymentMethod === "cash" && (
                                <Banknote className="text-warning size-4" />
                            )}
                            {completedSale.paymentMethod === "bank transfer" && (
                                <CreditCard className="text-info size-4" />
                            )}
                            {completedSale.paymentMethod === "mobile transfer" && (
                                <Wallet className="text-success size-4" />
                            )}
                            <span className="font-medium">
                                Paid via{" "}
                                {paymentLabel[completedSale.paymentMethod] ||
                                    completedSale.paymentMethod}
                            </span>
                        </div>

                        <p className="text-muted-foreground text-center text-xs">
                            Thank you for your purchase!
                        </p>
                    </div>

                    <div className="border-border flex gap-2 border-t p-5">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCloseReceipt}
                        >
                            <X data-icon="inline-start" />
                            Close
                        </Button>
                        <Button className="flex-1" onClick={handlePrint}>
                            <Printer data-icon="inline-start" />
                            Print Receipt
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── Checkout form view ────────────────────────────────────────────────────
    const itemCount = Object.keys(cart).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px]">
                <DialogHeader className="border-border border-b px-5 py-4">
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
                            <CheckCircle2 className="size-4" />
                        </span>
                        {isOrderMode ? "Complete Order" : "Complete Payment"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 p-5">
                    {/* Checkout Summary */}
                    <div className="bg-muted/40 border-border flex flex-col gap-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <ShoppingCart className="size-4" />
                                Checkout Summary
                            </div>
                            <span className="bg-background text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                            </span>
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-1.5 text-sm">
                            <div className="text-muted-foreground flex justify-between">
                                <span>Subtotal</span>
                                <span className="num-tabular">
                                    {fmt(subTotal)}
                                </span>
                            </div>
                            <div className="text-muted-foreground flex justify-between">
                                <span>Tax (4.0%)</span>
                                <span className="num-tabular">{fmt(tax)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Discount
                                </span>
                                <div className="relative w-28">
                                    <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-[10px] font-medium">
                                        GHS
                                    </span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={discountAmount || ""}
                                        onChange={(e) =>
                                            setDiscountAmount(
                                                Number(e.target.value),
                                            )
                                        }
                                        placeholder="0.00"
                                        className="num-tabular h-8 pl-10 text-right text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <span className="text-foreground text-base font-semibold">
                                Total Payable
                            </span>
                            <span className="num-tabular text-primary text-2xl font-bold">
                                {fmt(finalTotal)}
                            </span>
                        </div>
                    </div>

                    {/* Customer (order mode only) */}
                    {isOrderMode && (
                        <div className="flex flex-col gap-2">
                            <Label className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                                <User className="size-3.5" />
                                Select Customer{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={selectedCustomerId?.toString()}
                                onValueChange={(value) => {
                                    const id = Number(value);
                                    setSelectedCustomerId(id);
                                    const customer = customers.find(
                                        (c) => c.id === id,
                                    );
                                    if (customer?.address)
                                        setDeliveryAddress(customer.address);
                                }}
                            >
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="Choose a customer" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {isLoading ? (
                                        <div className="text-muted-foreground flex items-center justify-center gap-2 p-4 text-sm">
                                            <Loader2 className="size-4 animate-spin" />
                                            Loading customers…
                                        </div>
                                    ) : customers.length === 0 ? (
                                        <div className="text-muted-foreground p-4 text-center text-sm">
                                            No customers found
                                        </div>
                                    ) : (
                                        customers.map((c) => (
                                            <SelectItem
                                                key={c.id}
                                                value={c.id.toString()}
                                            >
                                                <div className="flex flex-col py-0.5">
                                                    <span className="text-foreground font-medium">
                                                        {c.first_name}{" "}
                                                        {c.last_name}
                                                    </span>
                                                    <span className="text-muted-foreground text-[10px]">
                                                        {c.phone}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Delivery address (order mode only) */}
                    {isOrderMode && (
                        <div className="flex flex-col gap-2">
                            <Label className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                                <MapPin className="size-3.5" />
                                Delivery Address
                                <span className="text-muted-foreground text-[10px] font-normal">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                placeholder="Enter delivery address"
                                value={deliveryAddress}
                                onChange={(e) =>
                                    setDeliveryAddress(e.target.value)
                                }
                                className="h-10"
                            />
                        </div>
                    )}

                    {/* Payment method */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-foreground text-sm font-medium">
                            Payment Method
                        </Label>
                        <ToggleGroup
                            type="single"
                            value={paymentMethod}
                            onValueChange={(v) => {
                                if (v)
                                    setPaymentMethod(
                                        v as
                                            | "cash"
                                            | "bank transfer"
                                            | "mobile transfer",
                                    );
                            }}
                            className="grid w-full grid-cols-3 gap-2"
                            variant="outline"
                        >
                            <ToggleGroupItem
                                value="bank transfer"
                                className="flex h-16 flex-col gap-1"
                            >
                                <CreditCard className="size-4" />
                                <span className="text-[11px] font-semibold tracking-wide uppercase">
                                    Card
                                </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="mobile transfer"
                                className="flex h-16 flex-col gap-1"
                            >
                                <Wallet className="size-4" />
                                <span className="text-[11px] font-semibold tracking-wide uppercase">
                                    Mobile
                                </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="cash"
                                className="flex h-16 flex-col gap-1"
                            >
                                <Banknote className="size-4" />
                                <span className="text-[11px] font-semibold tracking-wide uppercase">
                                    Cash
                                </span>
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                <DialogFooter className="border-border flex-row gap-2 border-t p-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-[2]"
                        onClick={handleComplete}
                        disabled={
                            isSubmitting ||
                            (isOrderMode &&
                                (!selectedCustomerId || !deliveryAddress))
                        }
                    >
                        {isSubmitting ? (
                            <Loader2
                                data-icon="inline-start"
                                className="animate-spin"
                            />
                        ) : null}
                        {isOrderMode ? "Confirm Order" : "Confirm & Pay"}
                        <ChevronRight data-icon="inline-end" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
