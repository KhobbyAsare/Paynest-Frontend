/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryItemProps {
    id: number | "all";
    name: string;
    icon?: string;
    count?: number;
    isSelected: boolean;
    onClick: (id: number | "all") => void;
}

const iconMap: Record<string, any> = {
    LayoutGrid: Icons.LayoutGrid,
    Package: Icons.Package,
    Electronics: Icons.Monitor,
    Computers: Icons.Monitor,
    Phones: Icons.Smartphone,
    Accessories: Icons.Headphones,
    Clothing: Icons.Shirt,
    "Men's Wear": Icons.Shirt,
    "Women's Wear": Icons.Shirt,
    Shoes: Icons.Footprints,
    Furniture: Icons.Sofa,
    Home: Icons.Home,
    Kitchen: Icons.Utensils,
    Books: Icons.Book,
    Media: Icons.Film,
    Sports: Icons.Trophy,
    Fitness: Icons.Dumbbell,
    Beauty: Icons.Sparkles,
    Cosmetics: Icons.Sparkles,
    Food: Icons.Coffee,
    Beverages: Icons.Beer,
    Other: Icons.Package,
    Default: Icons.LayoutGrid,
};

export function CategoryItem({
    id,
    name,
    icon = "Package",
    count,
    isSelected,
    onClick,
}: CategoryItemProps) {
    const Icon = iconMap[name] || iconMap[icon] || Icons.Package;

    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            data-active={isSelected}
            aria-pressed={isSelected}
            className={cn(
                "group/cat relative inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 transition-all",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/10",
            )}
        >
            <Icon className="size-4 shrink-0" />
            <span className="text-[13px] font-medium whitespace-nowrap">{name}</span>
            {count !== undefined && (
                <span
                    className={cn(
                        "num-tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover/cat:bg-background",
                    )}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
