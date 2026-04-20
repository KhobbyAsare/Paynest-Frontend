"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    separator?: boolean;
}

export default function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    children,
    className,
    separator = true,
}: PageHeaderProps) {
    const trailing = actions ?? children;

    return (
        <header className={cn("flex flex-col gap-3 pb-4", className)}>
            {breadcrumbs && breadcrumbs.length > 0 ? (
                <nav
                    aria-label="Breadcrumb"
                    className="text-muted-foreground flex items-center gap-1 text-sm"
                >
                    {breadcrumbs.map((crumb, i) => {
                        const isLast = i === breadcrumbs.length - 1;
                        return (
                            <React.Fragment key={`${crumb.label}-${i}`}>
                                {crumb.href && !isLast ? (
                                    <Link
                                        href={crumb.href}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span
                                        className={cn(
                                            isLast && "text-foreground font-medium",
                                        )}
                                    >
                                        {crumb.label}
                                    </span>
                                )}
                                {!isLast ? (
                                    <ChevronRight
                                        className="text-muted-foreground/60 size-3.5"
                                        aria-hidden="true"
                                    />
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </nav>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <h1 className="text-h2 text-foreground text-balance">{title}</h1>
                    {description ? (
                        <p className="text-body-sm text-muted-foreground max-w-2xl text-pretty">
                            {description}
                        </p>
                    ) : null}
                </div>
                {trailing ? (
                    <div className="flex flex-wrap items-center gap-2">{trailing}</div>
                ) : null}
            </div>

            {separator ? <Separator className="mt-1" /> : null}
        </header>
    );
}
