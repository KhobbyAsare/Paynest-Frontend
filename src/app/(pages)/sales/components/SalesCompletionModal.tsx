"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "antd";
import { Button } from "@/components/ui/button";
import { useSalesStore } from "@/(zustand-store)/salesStore";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { CreateWalkIns } from "@/(api-handlers)/orders_walkinsHandler";
import { GetAllCustomers } from "@/(api-handlers)/customersHandler";
import { CustomerResponse } from "@/interfaces/customers";
import { OrderRequest, WalkInsRequest } from "@/interfaces/orders_walkins";
import toast from "react-hot-toast";
import {
    CheckCircle2,
    CreditCard,
    Wallet,
    Banknote,
    User,
    ShoppingCart,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { handleErrorMessage } from "@/lib/handleErrorMessage";

interface SalesCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    subTotal: number;
    tax: number;
}

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
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleComplete = async () => {
        if (isOrderMode && !selectedCustomerId) {
            toast.error("Please select a customer for the order");
            return;
        }

        if (!user?.employee_profile?.shop_id) {
            toast.error("Shop information not found");
            return;
        }

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
                amount_paid: total
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
                    is_delivered: false,
                    actual_delivery_date: new Date().toISOString(),
                    expected_delivery_date: new Date().toISOString()
                };
                await CreateWalkIns(orderData);
                toast.success("Order created successfully!");
            } else {
                const walkInData: WalkInsRequest = {
                    shop_id: user.employee_profile.shop_id,
                    order_type: "sale",
                    order_status: "delivered", // Walk-ins are usually immediate
                    customer_id: null,
                    items,
                    payment,
                    delivery_amount: 0,
                    is_delivered: true,
                    actual_delivery_date: null,
                    expected_delivery_date: null
                };
                await CreateWalkIns(walkInData);
                toast.success("Sale completed successfully!");
            }

            clearCart();
            onClose();
        } catch (error) {
            handleErrorMessage(error, "Failed to process transaction. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-lg">
                <DialogHeader className="p-6 bg-white border-b border-slate-100 rounded-t-lg">
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
                                <span>${subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Tax (4.0%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                                <span className="text-lg font-bold text-slate-800">Total Payable</span>
                                <span className="text-2xl font-black text-primary-color">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Selection (Only for Order Mode) */}
                    {isOrderMode && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Select Customer <span className="text-rose-500">*</span>
                            </label>
                            <Select
                                className="w-full h-11"
                                placeholder="Choose a customer"
                                value={selectedCustomerId}
                                onChange={(value) => setSelectedCustomerId(value)}
                                options={customers.map((c) => ({
                                    value: c.id,
                                    label: (
                                        <div className="flex flex-col py-1">
                                            <span className="font-medium text-slate-800">{c.first_name} {c.last_name}</span>
                                            <span className="text-[10px] text-slate-500">{c.phone}</span>
                                        </div>
                                    )
                                }))}
                                showSearch
                                filterOption={(input, option) => {
                                    const customer = customers.find(c => c.id === option?.value);
                                    if (!customer) return false;
                                    const searchStr = `${customer.first_name} ${customer.last_name} ${customer.phone}`.toLowerCase();
                                    return searchStr.includes(input.toLowerCase());
                                }}
                                loading={isLoading}
                                notFoundContent={
                                    <div className="p-4 text-center text-slate-400 text-sm">
                                        No customers found
                                    </div>
                                }
                                getPopupContainer={(triggerNode) => triggerNode.parentNode}
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

                <DialogFooter className="p-6 bg-white border-t border-slate-100 mt-0">
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
                            disabled={isSubmitting || (isOrderMode && !selectedCustomerId)}
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
