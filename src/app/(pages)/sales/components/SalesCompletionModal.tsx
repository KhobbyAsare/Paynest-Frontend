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
import { cn } from "@/lib/utils";
import { handleErrorMessage } from "@/lib/handleErrorMessage";
import { Input } from "@/components/ui/input";

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
    cash: 'Cash',
    'bank transfer': 'Bank / Card',
    'mobile transfer': 'Mobile Money',
};

export function SalesCompletionModal({
    isOpen,
    onClose,
    total,
    subTotal,
    tax,
}: Readonly<SalesCompletionModalProps>) {
    const { cart, isOrderMode, paymentMethod, setPaymentMethod, clearCart } = useSalesStore();
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState<CustomerResponse[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

    const finalTotal = Math.max(0, total - discountAmount);

    useEffect(() => {
        if (isOpen && isOrderMode) {
            const fetchCustomers = async () => {
                setIsLoading(true);
                try {
                    const data = await GetAllCustomers();
                    setCustomers(data);
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

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setCompletedSale(null);
            setDiscountAmount(0);
            setSelectedCustomerId(null);
            setDeliveryAddress('');
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

        // Capture receipt data before clearing cart
        const receiptItems: ReceiptItem[] = Object.values(cart).map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.selling_price,
            lineTotal: item.product.selling_price * item.quantity,
        }));

        setIsSubmitting(true);
        try {
            const items = Object.values(cart).map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                notes: item.specialInstructions || ""
            }));
            const payment = {
                method: paymentMethod,
                status: "paid" as const,
                amount_paid: finalTotal
            };

            if (isOrderMode) {
                const orderData: OrderRequest = {
                    shop_id: user.employee_profile.shop_id,
                    order_type: "sale",
                    order_status: "initiated",
                    customer_id: selectedCustomerId!,
                    items: items.map(({ product_id, quantity }) => ({ product_id, quantity })),
                    payment,
                    delivery_amount: 0,
                    discount_amount: discountAmount,
                    is_delivered: false,
                    delivery_address: deliveryAddress || null,
                    actual_delivery_date: new Date().toISOString(),
                    expected_delivery_date: new Date().toISOString()
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
                    expected_delivery_date: null
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
                orgName: user.organization?.name || 'Paynest POS',
                timestamp: new Date(),
            });
            toast.success(isOrderMode ? "Order created successfully!" : "Sale completed successfully!");
        } catch (error) {
            handleErrorMessage(error, "Failed to process transaction. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        // Create a temporary iframe for printing
        const printContent = document.getElementById('receipt-print-area');
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const printHtml = printContent.cloneNode(true) as HTMLElement;

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Please allow popups to print the receipt");
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                        padding: 20px;
                        background: white;
                        color: black;
                    }
                    .receipt-container {
                        max-width: 400px;
                        margin: 0 auto;
                        background: white;
                    }
                    .bg-primary {
                        background-color: #10b981;
                    }
                    .text-white {
                        color: white;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .text-xs {
                        font-size: 0.75rem;
                    }
                    .text-sm {
                        font-size: 0.875rem;
                    }
                    .text-base {
                        font-size: 1rem;
                    }
                    .font-bold {
                        font-weight: bold;
                    }
                    .font-medium {
                        font-weight: 500;
                    }
                    .mb-2 {
                        margin-bottom: 0.5rem;
                    }
                    .mt-0 {
                        margin-top: 0;
                    }
                    .mt-1 {
                        margin-top: 0.25rem;
                    }
                    .mt-2 {
                        margin-top: 0.5rem;
                    }
                    .px-5 {
                        padding-left: 1.25rem;
                        padding-right: 1.25rem;
                    }
                    .px-6 {
                        padding-left: 1.5rem;
                        padding-right: 1.5rem;
                    }
                    .py-3 {
                        padding-top: 0.75rem;
                        padding-bottom: 0.75rem;
                    }
                    .py-4 {
                        padding-top: 1rem;
                        padding-bottom: 1rem;
                    }
                    .py-5 {
                        padding-top: 1.25rem;
                        padding-bottom: 1.25rem;
                    }
                    .space-y-1 > * + * {
                        margin-top: 0.25rem;
                    }
                    .space-y-1\\.5 > * + * {
                        margin-top: 0.375rem;
                    }
                    .space-y-4 > * + * {
                        margin-top: 1rem;
                    }
                    .border-t {
                        border-top: 1px solid #e5e7eb;
                    }
                    .border-b {
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .border-dashed {
                        border-style: dashed;
                    }
                    .border-slate-200 {
                        border-color: #e2e8f0;
                    }
                    .text-slate-400 {
                        color: #94a3b8;
                    }
                    .text-slate-500 {
                        color: #64748b;
                    }
                    .text-slate-700 {
                        color: #334155;
                    }
                    .text-slate-900 {
                        color: #0f172a;
                    }
                    .text-emerald-600 {
                        color: #059669;
                    }
                    .text-primary {
                        color: #10b981;
                    }
                    .bg-slate-50 {
                        background-color: #f8fafc;
                    }
                    .rounded-xl {
                        border-radius: 0.75rem;
                    }
                    .p-3 {
                        padding: 0.75rem;
                    }
                    .gap-2 {
                        gap: 0.5rem;
                    }
                    .flex {
                        display: flex;
                    }
                    .items-center {
                        align-items: center;
                    }
                    .justify-between {
                        justify-content: space-between;
                    }
                    .shrink-0 {
                        flex-shrink: 0;
                    }
                    .truncate {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .pr-2 {
                        padding-right: 0.5rem;
                    }
                    .pt-2 {
                        padding-top: 0.5rem;
                    }
                    .mx-auto {
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .size-4 {
                        width: 1rem;
                        height: 1rem;
                    }
                    .size-10 {
                        width: 2.5rem;
                        height: 2.5rem;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    ${printHtml.innerHTML}
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
        const fmt = (n: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(n);
        return (
            <Dialog open={isOpen} onOpenChange={handleCloseReceipt}>
                <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
                    <div id="receipt-print-area" className="bg-white">
                        {/* Header */}
                        <div className="bg-primary px-6 py-5 text-white text-center">
                            <CheckCircle2 className="size-10 mx-auto mb-2 text-white/90" />
                            <h2 className="text-lg font-bold">{completedSale.isOrder ? 'Order Placed' : 'Payment Complete'}</h2>
                            <p className="text-white/70 text-xs mt-0.5">{completedSale.orgName}</p>
                        </div>

                        {/* Receipt body */}
                        <div className="px-5 py-4 space-y-4">
                            {/* Meta */}
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{completedSale.timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span>{completedSale.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Items */}
                            <div className="space-y-1.5 border-t border-b border-dashed border-slate-200 py-3">
                                {completedSale.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-700 flex-1 truncate pr-2">{item.name} <span className="text-slate-400">×{item.quantity}</span></span>
                                        <span className="font-medium text-slate-900 shrink-0">{fmt(item.lineTotal)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{fmt(completedSale.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Tax</span>
                                    <span>{fmt(completedSale.tax)}</span>
                                </div>
                                {completedSale.discount > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Discount</span>
                                        <span>−{fmt(completedSale.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2 mt-1">
                                    <span className="text-slate-900">Total Paid</span>
                                    <span className="text-primary">{fmt(completedSale.total)}</span>
                                </div>
                            </div>

                            {/* Payment method */}
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                {completedSale.paymentMethod === 'cash' && <Banknote className="size-4 text-amber-500" />}
                                {completedSale.paymentMethod === 'bank transfer' && <CreditCard className="size-4 text-blue-500" />}
                                {completedSale.paymentMethod === 'mobile transfer' && <Wallet className="size-4 text-emerald-500" />}
                                <span className="text-sm font-medium text-slate-700">
                                    Paid via {paymentLabel[completedSale.paymentMethod] || completedSale.paymentMethod}
                                </span>
                            </div>

                            <p className="text-center text-xs text-slate-400">Thank you for your purchase!</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 px-5 pb-5 pt-0 no-print">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={handleCloseReceipt}>
                            <X className="size-4 mr-1" /> Close
                        </Button>
                        <Button className="flex-1 rounded-xl" onClick={handlePrint}>
                            <Printer className="size-4 mr-1" /> Print Receipt
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── Checkout form view ────────────────────────────────────────────────────
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0! gap-0! overflow-hidden bg-slate-50 border-none shadow-2xl rounded-lg ">
                <DialogHeader className="p-2 bg-white border-b border-slate-100 rounded-t-lg">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-primary-color/10 rounded-md">
                            <CheckCircle2 className="w-6 h-6 text-primary-color" />
                        </div>
                        {isOrderMode ? "Complete Order" : "Complete Payment"}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-3">
                    {/* Order Summary Card */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <ShoppingCart className="w-4 h-4" />
                                <span>Checkout Summary</span>
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                {Object.keys(cart).length} Items
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Subtotal</span>
                                <span>GHS {subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Tax (4.0%)</span>
                                <span>GHS {tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2">
                                <span className="text-slate-500">Discount Amount</span>
                                <div className="relative w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">GHS</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={discountAmount || ""}
                                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full h-8 pl-9 text-right font-medium text-sm bg-white border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                                <span className="text-lg font-bold text-slate-800">Total Payable</span>
                                <span className="text-2xl font-black text-primary-color">GHS {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Selection (Order Mode only) */}
                    {isOrderMode && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Select Customer <span className="text-rose-500">*</span>
                            </label>
                            <Select
                                value={selectedCustomerId?.toString()}
                                onValueChange={(value) => {
                                    const id = Number(value);
                                    setSelectedCustomerId(id);
                                    const customer = customers.find(c => c.id === id);
                                    if (customer?.address) setDeliveryAddress(customer.address);
                                }}
                            >
                                <SelectTrigger className="w-full h-11 bg-white border-slate-200">
                                    <SelectValue placeholder="Choose a customer" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {isLoading ? (
                                        <div className="p-4 text-center text-slate-400 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                            Loading customers...
                                        </div>
                                    ) : customers.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400 text-sm">No customers found</div>
                                    ) : (
                                        customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                <div className="flex flex-col py-0.5">
                                                    <span className="font-medium text-slate-800">{c.first_name} {c.last_name}</span>
                                                    <span className="text-[10px] text-slate-500">{c.phone}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Delivery Address (Order Mode only) */}
                    {isOrderMode && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Delivery Address (Optional)
                            </label>
                            <Input
                                placeholder="Enter delivery address"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="h-11 bg-white border-slate-200"
                            />
                        </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'bank transfer', icon: CreditCard, label: 'Card' },
                                { id: 'mobile transfer', icon: Wallet, label: 'Mobile' },
                                { id: 'cash', icon: Banknote, label: 'Cash' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as "bank transfer" | "mobile transfer" | "cash")}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                        paymentMethod === method.id
                                            ? "border-primary-color bg-primary-color/5 text-primary-color"
                                            : "border-white bg-white hover:border-slate-200 text-slate-500"
                                    )}
                                >
                                    <method.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-2 bg-white border-t border-slate-100 mt-0">
                    <div className="flex w-full gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-md border-slate-200"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-2 h-12 rounded-md bg-primary-color hover:opacity-90 text-white shadow-lg shadow-primary-color/20"
                            onClick={handleComplete}
                            disabled={isSubmitting || (isOrderMode && (!selectedCustomerId || !deliveryAddress))}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : null}
                            {isOrderMode ? "Confirm Order" : "Confirm & Pay"}
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}