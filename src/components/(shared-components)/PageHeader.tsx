"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

const PageHeader = ({
    title,
    description,
    children,
    className,
}: PageHeaderProps) => {


    return (
        <header
            className={cn(
                "flex flex-col gap-y-1 sm:flex-row sm:items-center sm:justify-between py-2",
                className
            )}
        >
            <div className="flex flex-col gap-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-[35px]">
                    {title}
                </h2>
                {description && (
                    <p className="text-base/7 font-medium text-gray-700 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    {children}
                </div>
            )}
        </header>
    );
};

export default PageHeader;
