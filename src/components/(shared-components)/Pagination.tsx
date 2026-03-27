import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    total?: number;
}

export default function Pagination({ page, totalPages, onPageChange, isLoading, total }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
        }, []);

    return (
        <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-500">
                Page {page} of {totalPages}{total != null ? ` · ${total} total` : ""}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1 || isLoading}
                    className="gap-1"
                >
                    <ChevronLeft className="size-4" />
                    Previous
                </Button>

                <div className="flex items-center gap-1">
                    {pageNumbers.map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p as number)}
                                disabled={isLoading}
                                className={cn(
                                    "size-8 rounded-lg text-sm font-medium transition-colors",
                                    page === p
                                        ? "bg-primary text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || isLoading}
                    className="gap-1"
                >
                    Next
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
