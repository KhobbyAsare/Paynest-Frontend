/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Search,
    Bell,
    CreditCard,
    Wallet,
    Banknote,
    ChevronRight,
    Clock,
    X,
    Receipt,
    ShoppingBag,
    TrendingUp,
    Users,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetProducts } from "@/(api-handlers)/productsHandler";
import { GetProductCategories } from "@/(api-handlers)/productCategoriesHandler";
import { ProductResponse } from "@/interfaces/products";
import { ProductCategoriesResponse } from "@/interfaces/productCategories";
import { CategoryItem } from "./components/CategoryItem";
import { ProductCard } from "./components/ProductCard";
import { CartItem } from "./components/CartItem";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { cn } from "@/lib/utils";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CartItemData {
    product: ProductResponse;
    quantity: number;
    specialInstructions?: string;
}

export default function SalesPage() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [categories, setCategories] = useState<ProductCategoriesResponse[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<Record<number, CartItemData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<"credit" | "paylater" | "cash">("credit");
    const [showCheckout, setShowCheckout] = useState(false);

    const { user } = useAuthStore();

    const cartItems = Object.values(cart);
    const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subTotal = cartItems.reduce(
        (acc, item) => acc + item.product.selling_price * item.quantity,
        0
    );
    const tax = subTotal * 0.04;
    const total = subTotal + tax;

    // Auto-show sidebar only when the first item is added to an empty cart
    useEffect(() => {
        if (itemCount > 0 && itemCount <= 1 && !showCheckout) {
            setShowCheckout(true);
        }
    }, [itemCount]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    GetProducts(),
                    GetProductCategories(),
                ]);
                setProducts(productsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load products and categories");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory =
                selectedCategoryId === "all" || product.category_id === selectedCategoryId;
            const matchesSearch = product.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategoryId, searchQuery]);

    const updateCartQuantity = (productId: number, delta: number, instructions?: string) => {
        setCart((prev) => {
            const currentItem = prev[productId];
            const product = products.find((p) => p.id === productId);

            if (!product) return prev;

            const newQuantity = (currentItem?.quantity || 0) + delta;

            if (newQuantity <= 0) {
                const rest = { ...prev };
                delete rest[productId];
                return rest;
            }

            return {
                ...prev,
                [productId]: {
                    product,
                    quantity: newQuantity,
                    specialInstructions: instructions || currentItem?.specialInstructions,
                },
            };
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => {
            const rest = { ...prev };
            delete rest[productId];
            return rest;
        });
    };
    return (
        <div className="min-h-[calc(100vh-80px)] bg-linear-to-br from-slate-50 via-white to-slate-50/50 relative">
            <div className="flex gap-0 p-4 lg:p-6">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    {/* Header */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-slate-100"
                    >
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search your menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">

                            {/* Sidebar Toggle / Cart Button */}
                            <button
                                onClick={() => setShowCheckout(!showCheckout)}
                                className={cn(
                                    "flex items-center gap-3 p-1.5 pr-4 rounded-xl border transition-all duration-300 group",
                                    showCheckout
                                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-200"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50/50"
                                )}
                            >
                                <div className={cn(
                                    "relative p-2 rounded-lg transition-colors",
                                    showCheckout ? "bg-white/20" : "bg-slate-100 group-hover:bg-violet-100 group-hover:text-violet-600"
                                )}>
                                    <ShoppingBag className="w-5 h-5" />
                                    {itemCount > 0 && (
                                        <span className={cn(
                                            "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ring-2",
                                            showCheckout ? "bg-white text-violet-600 ring-violet-600" : "bg-rose-500 text-white ring-white"
                                        )}>
                                            {itemCount}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className={cn(
                                        "text-[10px] font-semibold uppercase tracking-wider",
                                        showCheckout ? "text-white/70" : "text-slate-400"
                                    )}>Invoice</p>
                                    <p className="text-sm font-bold">${total.toFixed(2)}</p>
                                </div>
                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-transform duration-300",
                                    showCheckout ? "rotate-180 text-white/70" : "text-slate-400 group-hover:text-violet-400"
                                )} />
                            </button>

                            {/* Divider */}
                            {/* <div className="w-px h-8 bg-slate-100 mx-1 hidden lg:block" /> */}

                            {/* Compact User Profile */}
                            {/* <div className="flex items-center gap-2.5 pl-1">
                                <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-slate-100">
                                    <Image
                                        src={user?.profile_pic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80"}
                                        alt="User"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="hidden xl:block">
                                    <p className="text-xs font-bold text-slate-700 leading-tight">{user?.first_name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tighter">Cashier</p>
                                </div>
                            </div> */}
                        </div>
                    </motion.div>

                    {/* Categories */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
                    >
                        <CategoryItem
                            id="all"
                            name="All Items"
                            icon="LayoutGrid"
                            isSelected={selectedCategoryId === "all"}
                            onClick={() => setSelectedCategoryId("all")}
                        />
                        {categories.map((cat) => (
                            <CategoryItem
                                key={cat.id}
                                id={cat.id}
                                name={cat.name}
                                count={products.filter(p => p.category_id === cat.id).length}
                                isSelected={selectedCategoryId === cat.id}
                                onClick={(id) => setSelectedCategoryId(id as number)}
                            />
                        ))}
                    </motion.div>

                    {/* Product Grid */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="scrollbar-none"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                {selectedCategoryId === "all"
                                    ? "Popular Items"
                                    : categories.find(c => c.id === selectedCategoryId)?.name}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <TrendingUp className="w-4 h-4" />
                                <span>{filteredProducts.length} items available</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                                ))
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        quantity={cart[product.id]?.quantity || 0}
                                        onUpdateQuantity={updateCartQuantity}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="inline-flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Search className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-medium">No products found</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Invoice Sidebar Overlay */}
                <AnimatePresence>
                    {showCheckout && (
                        <>
                            {/* Backdrop for mobile and desktop when overlaying */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCheckout(false)}
                                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity lg:hidden"
                            />

                            <motion.div
                                key="sidebar"
                                initial={{ x: "100%", opacity: 0.5 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "100%", opacity: 0.5 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className={cn(
                                    "fixed right-0 top-0 h-full z-50 shadow-2xl flex flex-col",
                                    "w-full sm:w-[500px] lg:w-[480px]"
                                )}
                            >
                                <div className="h-full bg-white lg:rounded-md border-l lg:border border-slate-200 shadow-2xl lg:shadow-xl flex flex-col">
                                    {/* Header */}
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-linear-to-br from-violet-500 to-indigo-600 rounded-xl">
                                                    <Receipt className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-bold text-slate-800">Current Order</h2>
                                                    <p className="text-xs text-slate-400">{itemCount} items selected</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowCheckout(false)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <X className="w-5 h-5 text-slate-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cart Items */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-none">
                                        {cartItems.length > 0 ? (
                                            cartItems.map((item) => (
                                                <CartItem
                                                    key={item.product.id}
                                                    id={item.product.id}
                                                    name={item.product.name}
                                                    price={item.product.selling_price}
                                                    quantity={item.quantity}
                                                    onUpdateQuantity={updateCartQuantity}
                                                    onRemove={removeFromCart}
                                                />
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                                                <div className="w-24 h-24 bg-linear-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center">
                                                    <ShoppingBag className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-800 font-semibold">Your cart is empty</p>
                                                    <p className="text-sm text-slate-400 mt-1">Add items to get started</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="p-6 bg-linear-to-br from-slate-50 to-white border-t border-slate-100">
                                        <div className="space-y-4">
                                            {/* Summary Details */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400">Subtotal</span>
                                                    <span className="text-slate-800 font-medium">${subTotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400">Tax (4%)</span>
                                                    <span className="text-slate-800 font-medium">${tax.toFixed(2)}</span>
                                                </div>
                                                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                                    <span className="text-slate-600 font-semibold">Total</span>
                                                    <span className="text-2xl font-bold bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                                        ${total.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Payment Methods */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'credit', icon: CreditCard, label: 'Credit Card', color: 'from-blue-500 to-blue-600' },
                                                    { id: 'mobilemoney', icon: Wallet, label: 'Mobile Money', color: 'from-emerald-500 to-emerald-600' },
                                                    { id: 'cash', icon: Banknote, label: 'Cash', color: 'from-amber-500 to-amber-600' },
                                                ].map((method) => (
                                                    <button
                                                        key={method.id}
                                                        onClick={() => setPaymentMethod(method.id as any)}
                                                        className={cn(
                                                            "relative p-3 rounded-xl border-2 transition-all group",
                                                            paymentMethod === method.id
                                                                ? `border-${method.color.split('-')[1]}-500 bg-linear-to-br ${method.color} text-white`
                                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                                        )}
                                                    >
                                                        <method.icon className={cn(
                                                            "w-5 h-5 mx-auto mb-1 transition-colors",
                                                            paymentMethod === method.id ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                                        )} />
                                                        <span className={cn(
                                                            "text-[10px] font-medium block",
                                                            paymentMethod === method.id ? "text-white/90" : "text-slate-500"
                                                        )}>
                                                            {method.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Place Order Button */}
                                            <Button
                                                className="w-full py-6 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg shadow-violet-200 transition-all active:scale-[0.98]"
                                                disabled={cartItems.length === 0}
                                                onClick={() => {
                                                    toast.success("Order placed successfully!");
                                                    setCart({});
                                                }}
                                            >
                                                Place Order
                                                <ChevronRight className="w-5 h-5 ml-2" />
                                            </Button>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>12 active orders</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    <span>Avg. prep time 15min</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Mobile Toggle */}
                <AnimatePresence>
                    {!showCheckout && (
                        <motion.button
                            key="cart-toggle"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-linear-to-r from-violet-600 to-indigo-600 rounded-full shadow-xl"
                            onClick={() => setShowCheckout(true)}
                        >
                            <ShoppingBag className="w-6 h-6 text-white" />
                            {itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                                    {itemCount}
                                </span>
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}