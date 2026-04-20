"use client";

import * as React from "react";
import { SearchX } from "lucide-react";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title?: string;
    description?: string;
    /** Either a Lucide component or a JSX node. Both supported for back-compat. */
    icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
    /** Preferred: a slot for one or more action elements (Buttons, Links). */
    actions?: React.ReactNode;
    /** Back-compat: render a single primary button. */
    actionText?: string;
    onAction?: () => void;
    className?: string;
}

function isComponent(
    icon: EmptyStateProps["icon"],
): icon is React.ComponentType<{ className?: string }> {
    return typeof icon === "function";
}

export default function EmptyState({
    title = "No results found",
    description = "Try adjusting your search or filters to find what you are looking for.",
    icon = SearchX,
    actions,
    actionText,
    onAction,
    className,
}: Readonly<EmptyStateProps>) {
    const renderedActions =
        actions ??
        (actionText && onAction ? (
            <Button onClick={onAction}>{actionText}</Button>
        ) : null);

    return (
        <Empty className={cn("border", className)}>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    {isComponent(icon) ? React.createElement(icon) : icon}
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            {renderedActions ? <EmptyContent>{renderedActions}</EmptyContent> : null}
        </Empty>
    );
}
