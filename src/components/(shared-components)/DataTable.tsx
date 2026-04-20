"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export interface DataTableColumn<T> {
    key: string;
    header: React.ReactNode;
    cell: (row: T, rowIndex: number) => React.ReactNode;
    align?: "left" | "right" | "center";
    className?: string;
    headerClassName?: string;
    width?: string;
    numeric?: boolean;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows: T[];
    rowKey: (row: T, index: number) => string | number;
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
    skeletonRows?: number;
    emptyState?: React.ReactNode;
    className?: string;
    stickyHeader?: boolean;
}

const ALIGN_CLASSES = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
} as const;

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    onRowClick,
    isLoading,
    skeletonRows = 5,
    emptyState,
    className,
    stickyHeader,
}: DataTableProps<T>) {
    const showEmpty = !isLoading && rows.length === 0;

    return (
        <Card className={cn("overflow-hidden p-0", className)}>
            <Table>
                <TableHeader
                    className={cn(
                        "bg-muted/40",
                        stickyHeader && "sticky top-0 z-10",
                    )}
                >
                    <TableRow className="hover:bg-muted/40">
                        {columns.map((col) => (
                            <TableHead
                                key={col.key}
                                style={col.width ? { width: col.width } : undefined}
                                className={cn(
                                    "text-overline h-11 px-4",
                                    ALIGN_CLASSES[col.align ?? "left"],
                                    col.headerClassName,
                                )}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isLoading
                        ? Array.from({ length: skeletonRows }).map((_, i) => (
                            <TableRow key={`skel-${i}`} className="hover:bg-transparent">
                                {columns.map((col) => (
                                    <TableCell key={col.key} className="px-4 py-3">
                                        <Skeleton className="h-4 w-3/4" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                        : rows.map((row, i) => (
                            <TableRow
                                key={rowKey(row, i)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(
                                    onRowClick && "cursor-pointer",
                                )}
                            >
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        className={cn(
                                            "px-4 py-3",
                                            ALIGN_CLASSES[col.align ?? "left"],
                                            col.numeric && "num-tabular",
                                            col.className,
                                        )}
                                    >
                                        {col.cell(row, i)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                    {showEmpty && emptyState ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell
                                colSpan={columns.length}
                                className="px-4 py-10"
                            >
                                {emptyState}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
        </Card>
    );
}

export default DataTable;
