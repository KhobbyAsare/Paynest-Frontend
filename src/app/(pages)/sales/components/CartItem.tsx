"use client";

import { useState } from "react";
import Image from "next/image";
import { Hash, MessageSquare, Minus, Package, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItemProps {
    id: number;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
    imageUrl?: string;
    onUpdateQuantity: (id: number, delta: number, instructions?: string) => void;
    onRemove: (id: number) => void;
}

const PLACEHOLDER_GRADIENTS = [
    "from-brand-700 to-brand-500",
    "from-info to-brand-600",
    "from-brand-800 to-info",
    "from-brand-600 to-brand-400",
    "from-info/80 to-brand-700",
];

function pickGradient(name: string) {
    const hash = Array.from(name).reduce(
        (acc, char) => char.codePointAt(0)! + ((acc << 5) - acc),
        0,
    );
    return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}

export function CartItem({
    id,
    name,
    price,
    quantity,
    sku,
    imageUrl,
    onUpdateQuantity,
    onRemove,
}: Readonly<CartItemProps>) {
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState("");
    const [imageError, setImageError] = useState(false);

    return (
        <div className="group bg-card border-border hover:border-primary/40 hover:shadow-xs rounded-xl border p-3 transition-all">
            <div className="flex gap-3">
                <div
                    className={cn(
                        "relative size-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br",
                        pickGradient(name),
                    )}
                >
                    {!imageError && imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            onError={() => setImageError(true)}
                            sizes="56px"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <Package className="size-5 opacity-85" />
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="text-foreground truncate text-sm font-semibold leading-tight">
                                {name}
                            </h4>
                            <p className="text-muted-foreground num-tabular mt-0.5 text-[11px]">
                                GHS {price.toFixed(2)} each
                                {sku && (
                                    <>
                                        {" · "}
                                        <span className="inline-flex items-center gap-0.5 font-mono">
                                            <Hash className="size-2.5" />
                                            {sku}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-7 shrink-0"
                            onClick={() => onRemove(id)}
                            aria-label={`Remove ${name}`}
                        >
                            <X />
                        </Button>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="num-tabular text-primary text-sm font-bold tracking-tight">
                            GHS {(price * quantity).toFixed(2)}
                        </span>
                        <div className="bg-muted flex items-center rounded-lg p-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-md"
                                onClick={() => onUpdateQuantity(id, -1)}
                                aria-label="Decrease quantity"
                            >
                                <Minus className="size-3" />
                            </Button>
                            <span className="num-tabular text-foreground w-6 text-center text-xs font-bold">
                                {quantity}
                            </span>
                            <Button
                                size="icon"
                                className="size-7 rounded-md"
                                onClick={() => onUpdateQuantity(id, 1)}
                                aria-label="Increase quantity"
                            >
                                <Plus className="size-3" />
                            </Button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowNotes(!showNotes)}
                        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 self-start text-[10px] transition-colors"
                    >
                        <MessageSquare className="size-3" />
                        {notes ? "Edit note" : "Add note"}
                    </button>
                </div>
            </div>

            {showNotes && (
                <Input
                    value={notes}
                    onChange={(e) => {
                        setNotes(e.target.value);
                        onUpdateQuantity(id, 0, e.target.value);
                    }}
                    placeholder="e.g. gift wrap, urgent"
                    className="mt-2.5 h-8 text-xs"
                />
            )}
        </div>
    );
}
