"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
    children?: React.ReactNode;
    className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function ToolbarLeft({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-1 flex-wrap items-center gap-2", className)}>
            {children}
        </div>
    );
}

export function ToolbarRight({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {children}
        </div>
    );
}

interface ToolbarSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function ToolbarSearch({
    value,
    onChange,
    placeholder = "Search…",
    disabled,
    className,
}: ToolbarSearchProps) {
    return (
        <div className={cn("relative w-full sm:w-64", className)}>
            <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden="true"
            />
            <Input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="pr-9 pl-9"
                aria-label={placeholder}
            />
            {value ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange("")}
                    disabled={disabled}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                >
                    <X className="size-3.5" />
                </Button>
            ) : null}
        </div>
    );
}

export default Toolbar;
