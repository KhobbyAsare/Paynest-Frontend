'use client'

import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
    title?: string
    description?: string
    icon?: React.ReactNode
    onAction?: () => void
    actionText?: string
    actions?: React.ReactNode
}

export default function EmptyState({
    title = 'No results found',
    description = 'Try adjusting your search or filters to find what you are looking for.',
    icon = <SearchX className="size-12 text-gray-400" />,
    onAction,
    actionText,
    actions
}: Readonly<EmptyStateProps>) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
                {description}
            </p>
            {actions ? (
                <div className="mt-6">
                    {actions}
                </div>
            ) : onAction && actionText && (
                <div className="mt-6">
                    <Button onClick={onAction} className="flex items-center gap-2">
                        {actionText}
                    </Button>
                </div>
            )}
        </div>
    )
}
