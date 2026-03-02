"use client";

import { Minus, Plus, X, MessageSquare, Package, ImageIcon, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export function CartItem({ id, name, price, quantity, sku, imageUrl, onUpdateQuantity, onRemove }: CartItemProps) {
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState("");
    const [imageError, setImageError] = useState(false);

    // Generate consistent color based on name
    const getPlaceholderColor = (name: string) => {
        const colors = [
            'from-blue-500 to-indigo-600',
            'from-emerald-500 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-rose-500 to-pink-600',
            'from-purple-500 to-fuchsia-600',
        ];
        const hash = name.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="group bg-white rounded-xl border border-slate-100 hover:border-primary-color/20 hover:shadow-md transition-all overflow-hidden"
        >
            <div className="p-3">
                <div className="flex gap-3">
                    {/* Product Image with Gradient Placeholder */}
                    <div className={cn(
                        "relative w-16 h-16 rounded-lg overflow-hidden bg-linear-to-br shrink-0",
                        getPlaceholderColor(name)
                    )}>
                        {!imageError && imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={name}
                                fill
                                className="object-cover"
                                onError={() => setImageError(true)}
                                sizes="64px"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <Package className="w-6 h-6 opacity-80" />
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <h4 className="font-semibold text-slate-800 text-sm truncate">{name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {sku && (
                                        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                            <Hash className="w-3 h-3" />
                                            {sku}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => onRemove(id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 rounded-lg"
                            >
                                <X className="w-4 h-4 text-rose-400" />
                            </button>
                        </div>

                        {/* Notes Toggle - Optional for general POS */}
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 hover:text-primary-color transition-colors"
                        >
                            <MessageSquare className="w-3 h-3" />
                            {notes ? "Edit notes" : "Add notes"}
                        </button>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-bold text-primary-color">
                                ${(price * quantity).toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                                <button
                                    onClick={() => onUpdateQuantity(id, -1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-primary-color hover:bg-white transition-all"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-semibold text-slate-700">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => onUpdateQuantity(id, 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md bg-primary-color text-white hover:opacity-90 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Input */}
                <AnimatePresence>
                    {showNotes && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => {
                                    setNotes(e.target.value);
                                    onUpdateQuantity(id, 0, e.target.value);
                                }}
                                placeholder="Add notes (e.g., gift wrap, urgent, etc.)"
                                className="w-full mt-3 p-2 text-xs bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-primary-color/20"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}