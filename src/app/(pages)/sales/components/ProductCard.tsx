"use client";

import { Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { ProductResponse } from "@/interfaces/products";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
    product: ProductResponse;
    quantity: number;
    onUpdateQuantity: (productId: number, delta: number) => void;
}

const PLACEHOLDER_GRADIENTS = [
    "from-brand-700 to-brand-500",
    "from-info to-brand-600",
    "from-brand-800 to-info",
    "from-brand-600 to-brand-400",
    "from-info/80 to-brand-700",
    "from-brand-500 to-brand-800",
];

function pickGradient(name: string) {
    const hash = Array.from(name).reduce(
        (acc, char) => char.codePointAt(0)! + ((acc << 5) - acc),
        0,
    );
    return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}

function stockTone(stock: number | undefined) {
    if (stock === undefined) return null;
    if (stock <= 0)
        return {
            label: "Out of stock",
            className: "bg-destructive text-destructive-foreground",
        };
    if (stock <= 10)
        return {
            label: `${stock} left`,
            className: "bg-warning text-warning-foreground",
        };
    return {
        label: `${stock} in stock`,
        className: "bg-success text-success-foreground",
    };
}

export function ProductCard({
    product,
    quantity,
    onUpdateQuantity,
}: Readonly<ProductCardProps>) {
    const [imageError, setImageError] = useState(false);
    const gradient = pickGradient(product.name);
    const stock = stockTone(product.stock_quantity);
    const outOfStock = product.stock_quantity === 0;
    const inCart = quantity > 0;

    return (
        <div
            data-in-cart={inCart}
            className={cn(
                "group bg-card border-border flex flex-col overflow-hidden rounded-2xl border transition-all duration-200",
                "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
                "data-[in-cart=true]:border-primary data-[in-cart=true]:ring-2 data-[in-cart=true]:ring-primary/20",
            )}
        >
            {/* Media */}
            <div
                className={cn(
                    "relative aspect-[4/3] overflow-hidden bg-gradient-to-br",
                    gradient,
                )}
            >
                {!imageError && product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <Package className="mb-1.5 size-9 opacity-85" />
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium opacity-95 backdrop-blur-sm">
                            {product.category || "Product"}
                        </span>
                    </div>
                )}
                {stock && (
                    <Badge
                        className={cn(
                            "absolute top-2 right-2 gap-1 border-0 text-[10px] font-semibold shadow-sm",
                            stock.className,
                        )}
                    >
                        <Package className="size-3" />
                        {stock.label}
                    </Badge>
                )}
                {inCart && (
                    <div className="num-tabular bg-foreground text-background absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-sm">
                        ×{quantity}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-1.5 p-3">
                <h3 className="text-foreground line-clamp-1 text-sm font-semibold leading-tight">
                    {product.name}
                </h3>

                {(product.sku || product.barcode) && (
                    <p className="text-muted-foreground truncate font-mono text-[10px]">
                        {product.sku ? `SKU ${product.sku}` : null}
                        {product.sku && product.barcode ? " · " : null}
                        {product.barcode}
                    </p>
                )}

                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-muted-foreground text-[10px] font-medium">
                        GHS
                    </span>
                    <span className="num-tabular text-foreground text-lg font-bold tracking-tight">
                        {product.selling_price.toFixed(2)}
                    </span>
                </div>

                <div className="mt-auto pt-2">
                    {inCart ? (
                        <div className="bg-muted flex items-center justify-between rounded-lg p-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 rounded-md"
                                onClick={() => onUpdateQuantity(product.id, -1)}
                                aria-label="Decrease quantity"
                            >
                                <Minus className="size-3.5" />
                            </Button>
                            <span className="num-tabular text-foreground text-sm font-bold">
                                {quantity}
                            </span>
                            <Button
                                size="icon"
                                className="size-7 rounded-md"
                                onClick={() => onUpdateQuantity(product.id, 1)}
                                aria-label="Increase quantity"
                            >
                                <Plus className="size-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            className="h-9 w-full font-semibold"
                            disabled={outOfStock}
                            onClick={() => onUpdateQuantity(product.id, 1)}
                        >
                            <ShoppingCart data-icon="inline-start" />
                            {outOfStock ? "Out of stock" : "Add to cart"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
