'use client'

import { Loader2 } from 'lucide-react'

interface LoadingProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    fullPage?: boolean
    text?: string
}

export default function Loading({
    className = '',
    size = 'md',
    fullPage = false,
    text = 'Loading...'
}: LoadingProps) {
    const sizeClasses = {
        sm: 'size-4',
        md: 'size-8',
        lg: 'size-12',
        xl: 'size-16'
    }

    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
            {text && <p className="text-sm font-medium text-gray-500">{text}</p>}
        </div>
    )

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                {content}
            </div>
        )
    }

    return content
}
