"use client";

import { Minus, Plus, ShoppingCart, Package, LucideIcon } from "lucide-react";
import { ProductResponse } from "@/interfaces/products";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProductCardProps {
    product: ProductResponse;
    quantity: number;
    onUpdateQuantity: (productId: number, delta: number) => void;
}

// Generate a consistent color based on product name for the placeholder
const getPlaceholderColor = (name: string) => {
    const colors = [
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-purple-500 to-fuchsia-600',
        'from-cyan-500 to-sky-600',
    ];

    // Simple hash function to get consistent color index
    const hash = name.split('').reduce((acc, char) => {
        return (char.codePointAt(0) || 0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
};

// Category to icon mapping
const categoryIcons: Record<string, LucideIcon> = {
    "default": Package,
};

export function ProductCard({ product, quantity, onUpdateQuantity }: Readonly<ProductCardProps>) {
    const [imageError, setImageError] = useState(false);
    const Icon = categoryIcons[product.category || "default"] || Package;
    const placeholderColor = getPlaceholderColor(product.name);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all overflow-hidden"
        >
            {/* Product Image */}
            <div className={cn(
                "relative h-40 overflow-hidden bg-gradient-to-br",
                placeholderColor
            )}>
                {!imageError && product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <Icon className="w-12 h-12 mb-2 opacity-80" />
                        <span className="text-xs font-medium opacity-80 px-2 py-1 bg-white/20 rounded-full">
                            {product.category || "Product"}
                        </span>
                    </div>
                )}

                {/* Stock Status Badge */}
                {product.stock_quantity !== undefined && (
                    <div className="absolute top-2 right-2">
                        <div className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-lg",
                            product.stock_quantity > 10
                                ? "bg-emerald-500/90 text-white"
                                : product.stock_quantity > 0
                                    ? "bg-amber-500/90 text-white"
                                    : "bg-rose-500/90 text-white"
                        )}>
                            <Package className="w-3 h-3" />
                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                        </div>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                    <div className="shrink-0">
                        <span className="text-lg font-bold text-slate-900">
                            ${product.selling_price.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* SKU/Barcode */}
                <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-400">
                    {product.sku && (
                        <span className="font-mono">SKU: {product.sku}</span>
                    )}
                    {product.barcode && (
                        <span className="font-mono">• {product.barcode}</span>
                    )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[32px]">
                    {product.description || "No description available"}
                </p>

                {/* Quantity Controls */}
                {quantity > 0 ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                            <button
                                onClick={() => onUpdateQuantity(product.id, -1)}
                                disabled={quantity === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-white transition-all disabled:opacity-30"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-700">
                                {quantity}
                            </span>
                            <button
                                onClick={() => onUpdateQuantity(product.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        disabled={product.stock_quantity === 0}
                        className={cn(
                            "w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2",
                            product.stock_quantity === 0
                                ? "bg-slate-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}