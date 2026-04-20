"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        direction: "up" | "down" | "neutral";
        label: string;
    };
    sub?: string;
    loading?: boolean;
    className?: string;
}

export function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    sub,
    loading,
    className,
}: StatCardProps) {
    return (
        <Card className={cn("gap-3 py-5 transition-shadow hover:shadow-md", className)}>
            <CardContent className="flex flex-col gap-3 px-5">
                <div className="flex items-center justify-between">
                    <span className="text-overline">{label}</span>
                    {Icon ? (
                        <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-xl">
                            <Icon className="size-4" />
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1">
                    {loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <span className="text-h1 num-tabular text-foreground">
                            {value}
                        </span>
                    )}
                    {sub ? (
                        <span className="text-caption">{sub}</span>
                    ) : null}
                </div>

                {trend ? (
                    <Badge
                        variant={
                            trend.direction === "up"
                                ? "default"
                                : trend.direction === "down"
                                    ? "destructive"
                                    : "secondary"
                        }
                        className="w-fit gap-1"
                    >
                        {trend.direction === "up" ? (
                            <ArrowUpRight className="size-3" />
                        ) : trend.direction === "down" ? (
                            <ArrowDownRight className="size-3" />
                        ) : null}
                        {trend.label}
                    </Badge>
                ) : null}
            </CardContent>
        </Card>
    );
}

export default StatCard;
