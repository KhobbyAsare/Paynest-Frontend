"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Bell,
    CheckCheck,
    ShoppingCart,
    Package,
    FileText,
    AlertTriangle,
    Shield,
    Clock,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/(shared-components)/PageHeader";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    AppNotification,
} from "@/(api-handlers)/notificationsHandler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    new_order:     { label: "New Order",     icon: ShoppingCart,  color: "text-blue-600",   bg: "bg-blue-50" },
    low_stock:     { label: "Low Stock",     icon: Package,       color: "text-amber-600",  bg: "bg-amber-50" },
    report_ready:  { label: "Report",        icon: FileText,      color: "text-violet-600", bg: "bg-violet-50" },
    daily_closure: { label: "Daily Closure", icon: Clock,         color: "text-emerald-600",bg: "bg-emerald-50" },
    system_alert:  { label: "System",        icon: Shield,        color: "text-rose-600",   bg: "bg-rose-50" },
};

const FALLBACK_TYPE = { label: "Notification", icon: Bell, color: "text-slate-500", bg: "bg-slate-50" };

function NotifIcon({ type }: { type: string }) {
    const cfg = TYPE_CONFIG[type] ?? FALLBACK_TYPE;
    const Icon = cfg.icon;
    return (
        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
            <Icon className={cn("size-5", cfg.color)} />
        </div>
    );
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchPage = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await getNotifications(PAGE_SIZE, (p - 1) * PAGE_SIZE);
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
            setTotal(data.total);
        } catch {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(page);
    }, [page, fetchPage]);

    const handleMarkRead = async (notif: AppNotification) => {
        if (!notif.is_read) {
            try {
                await markNotificationRead(notif.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch {
                // ignore — non-critical
            }
        }
        if (notif.entity_type === "order" && notif.entity_id) {
            router.push(`/orders/${notif.entity_id}`);
        } else if (notif.entity_type === "report" && notif.entity_id) {
            router.push(`/report/${notif.entity_id}`);
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch {
            toast.error("Failed to mark all as read");
        } finally {
            setMarkingAll(false);
        }
    };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Notifications"
                description={
                    unreadCount > 0
                        ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                        : "You're all caught up"
                }
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 font-semibold">
                            {unreadCount} unread
                        </Badge>
                    )}
                    <span className="text-sm text-slate-400">{total} total</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchPage(page)}
                        disabled={loading}
                        className="gap-1.5"
                    >
                        <RefreshCcw className={cn("size-3.5", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            className="gap-1.5"
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-slate-50">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-5">
                                <div className="size-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2 py-0.5">
                                    <div className="h-3.5 bg-slate-100 rounded animate-pulse w-1/3" />
                                    <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                                    <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center">
                            <Bell className="size-9 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700">No notifications yet</p>
                            <p className="text-sm text-slate-400 mt-1">
                                You&apos;ll see order confirmations, stock alerts, and report updates here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-50">
                        {notifications.map(notif => {
                            const cfg = TYPE_CONFIG[notif.type] ?? FALLBACK_TYPE;
                            const isClickable =
                                (notif.entity_type === "order" || notif.entity_type === "report") &&
                                notif.entity_id != null;

                            return (
                                <li
                                    key={notif.id}
                                    onClick={() => handleMarkRead(notif)}
                                    className={cn(
                                        "flex items-start gap-4 px-5 py-4 transition-colors",
                                        isClickable ? "cursor-pointer hover:bg-slate-50" : "",
                                        !notif.is_read ? "bg-blue-50/40 hover:bg-blue-50/60" : ""
                                    )}
                                >
                                    {/* Unread dot */}
                                    <div className="flex items-center self-stretch w-2 shrink-0">
                                        {!notif.is_read && (
                                            <span className="size-2 rounded-full bg-blue-500 mt-3" />
                                        )}
                                    </div>

                                    <NotifIcon type={notif.type} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !notif.is_read ? "font-semibold text-slate-800" : "font-medium text-slate-700"
                                                )}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] font-semibold border-0", cfg.bg, cfg.color)}
                                                >
                                                    {cfg.label}
                                                </Badge>
                                                {isClickable && (
                                                    <ExternalLink className="size-3.5 text-slate-300" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {fmtDate(notif.created_at)}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-slate-500">
                        Page {page} of {totalPages} · {total} notifications
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="gap-1"
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === "..." ? (
                                        <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p as number)}
                                            disabled={loading}
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
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
