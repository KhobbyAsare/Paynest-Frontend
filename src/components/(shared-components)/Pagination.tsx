"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    total?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
    className?: string;
}

export default function Pagination({
    page,
    totalPages,
    onPageChange,
    isLoading,
    total,
    pageSize,
    pageSizeOptions = [10, 20, 50, 100],
    onPageSizeChange,
    className,
}: PaginationProps) {
    if (totalPages <= 1 && !onPageSizeChange) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
        }, []);

    return (
        <div
            className={cn(
                "flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between",
                className,
            )}
        >
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
                <span>
                    Page <span className="num-tabular text-foreground font-medium">{page}</span> of{" "}
                    <span className="num-tabular text-foreground font-medium">{totalPages}</span>
                    {total != null && (
                        <>
                            {" · "}
                            <span className="num-tabular text-foreground font-medium">{total}</span>{" "}
                            total
                        </>
                    )}
                </span>

                {onPageSizeChange && pageSize ? (
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">Rows</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => onPageSizeChange(Number(v))}
                            disabled={isLoading}
                        >
                            <SelectTrigger size="sm" className="h-8 w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((opt) => (
                                    <SelectItem key={opt} value={String(opt)}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}
            </div>

            {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1 || isLoading}
                        className="gap-1"
                    >
                        <ChevronLeft className="size-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="hidden items-center gap-1 sm:flex">
                        {pageNumbers.map((p, i) =>
                            p === "..." ? (
                                <span
                                    key={`ellipsis-${i}`}
                                    className="text-muted-foreground px-2 text-sm"
                                >
                                    …
                                </span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => onPageChange(p as number)}
                                    disabled={isLoading}
                                    className="num-tabular size-8 p-0"
                                >
                                    {p}
                                </Button>
                            ),
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages || isLoading}
                        className="gap-1"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
