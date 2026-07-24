"use client";

import { cn } from "@/lib/utils";

export interface StatItem {
    name: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
}

interface StatsGridProps {
    stats: StatItem[];
    columns?: 2 | 3 | 4 | 5 | 6;
    className?: string;
}

const COLS: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
    6: "sm:grid-cols-3 lg:grid-cols-6",
};

export default function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent",
            className
        )}>
            {/* Decorative blobs — same treatment as the SuperAdmin dashboard hero stats strip */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-10 -right-10 size-52 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-8 left-1/4 size-40 rounded-full bg-info/5 blur-3xl" />
            </div>

            <dl className={cn(
                "relative grid grid-cols-1 gap-y-6 px-6 py-6 lg:gap-y-0 lg:divide-x lg:divide-border/50",
                COLS[columns] ?? COLS[4]
            )}>
                {stats.map((stat) => (
                    <div key={stat.name} className="flex flex-col gap-2 first:pl-0 last:pr-0 lg:px-6">
                        <dt className="text-sm font-medium text-muted-foreground">{stat.name}</dt>
                        <dd className="text-[22px] font-bold leading-none tracking-tight text-foreground">
                            {stat.value}
                        </dd>
                        {stat.change && (
                            <dd className={cn(
                                "text-xs",
                                stat.changeType === "negative" ? "text-destructive" : "text-muted-foreground"
                            )}>
                                {stat.change}
                            </dd>
                        )}
                    </div>
                ))}
            </dl>
        </div>
    );
}
