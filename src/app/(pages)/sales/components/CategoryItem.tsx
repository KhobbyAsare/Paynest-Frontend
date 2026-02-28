/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface CategoryItemProps {
    id: number | "all";
    name: string;
    icon?: string;
    count?: number;
    isSelected: boolean;
    onClick: (id: number | "all") => void;
}

// Map category names to appropriate icons for general POS
const iconMap: Record<string, any> = {
    // Default
    LayoutGrid: Icons.LayoutGrid,
    Package: Icons.Package,

    // Electronics
    Electronics: Icons.Monitor,
    Computers: Icons.Monitor,
    Phones: Icons.Smartphone,
    Accessories: Icons.Headphones,

    // Clothing
    Clothing: Icons.Shirt,
    "Men's Wear": Icons.Shirt,
    "Women's Wear": Icons.Shirt,
    Shoes: Icons.Footprints,

    // Home & Living
    Furniture: Icons.Sofa,
    Home: Icons.Home,
    Kitchen: Icons.Utensils,

    // Books & Media
    Books: Icons.Book,
    Media: Icons.Film,

    // Sports
    Sports: Icons.Trophy,
    Fitness: Icons.Dumbbell,

    // Beauty
    Beauty: Icons.Sparkles,
    Cosmetics: Icons.Sparkles,

    // Food & Beverages (if still needed)
    Food: Icons.Coffee,
    Beverages: Icons.Beer,

    // Generic
    Other: Icons.Package,
    Default: Icons.LayoutGrid,
};

export function CategoryItem({ id, name, icon = "Package", count, isSelected, onClick }: CategoryItemProps) {
    const Icon = iconMap[name] || iconMap[icon] || Icons.Package;

    return (
        <motion.button
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClick(id)}
            className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 min-w-[100px] gap-2",
                isSelected
                    ? "bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
                    : "bg-white border border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-md"
            )}
        >
            <div className={cn(
                "p-2 rounded-lg transition-colors",
                isSelected ? "bg-white/20" : "bg-slate-50"
            )}>
                <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-slate-500")} />
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold whitespace-nowrap">{name}</p>
                {count !== undefined && (
                    <p className={cn("text-[10px] mt-0.5", isSelected ? "text-white/80" : "text-slate-400")}>
                        {count} items
                    </p>
                )}
            </div>
        </motion.button>
    );
}