"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Bell, CheckCheck, ShoppingCart, Package, FileText,
    Shield, Clock, ChevronLeft, ChevronRight, RefreshCcw, ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/(shared-components)/PageHeader";
import {
    getNotifications, markNotificationRead, markAllNotificationsRead, AppNotification,
} from "@/(api-handlers)/notificationsHandler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; colorClass: string; bgClass: string }> = {
    new_order:     { label: "New Order",     icon: ShoppingCart, colorClass: "text-info",              bgClass: "bg-info/10" },
    low_stock:     { label: "Low Stock",     icon: Package,      colorClass: "text-warning-foreground", bgClass: "bg-warning/10" },
    report_ready:  { label: "Report",        icon: FileText,     colorClass: "text-primary",            bgClass: "bg-primary/10" },
    daily_closure: { label: "Daily Closure", icon: Clock,        colorClass: "text-success",            bgClass: "bg-success/10" },
    system_alert:  { label: "System",        icon: Shield,       colorClass: "text-destructive",        bgClass: "bg-destructive/10" },
};
const FALLBACK = { label: "Notification", icon: Bell, colorClass: "text-muted-foreground", bgClass: "bg-muted" };

function NotifIcon({ type }: { type: string }) {
    const cfg = TYPE_CONFIG[type] ?? FALLBACK;
    const Icon = cfg.icon;
    return (
        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", cfg.bgClass)}>
            <Icon className={cn("size-5", cfg.colorClass)} />
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

    useEffect(() => { fetchPage(page); }, [page, fetchPage]);

    const handleMarkRead = async (notif: AppNotification) => {
        if (!notif.is_read) {
            try {
                await markNotificationRead(notif.id);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch { /* non-critical */ }
        }
        if (notif.entity_type === "order" && notif.entity_id) router.push(`/orders/${notif.entity_id}`);
        else if (notif.entity_type === "report" && notif.entity_id) router.push(`/report/${notif.entity_id}`);
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
        new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Notifications"
                description={unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                    : "You're all caught up"}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Badge className="border-destructive/30 bg-destructive/10 text-destructive font-semibold">
                            {unreadCount} unread
                        </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{total} total</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchPage(page)} disabled={loading} className="gap-1.5">
                        <RefreshCcw className={cn("size-3.5", loading && "animate-spin")} /> Refresh
                    </Button>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll} className="gap-1.5">
                            <CheckCheck className="size-3.5" /> Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="bg-card rounded-2xl border overflow-hidden">
                {loading ? (
                    <div className="divide-y">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-5">
                                <Skeleton className="size-10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2 py-0.5">
                                    <Skeleton className="h-3.5 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="size-20 bg-muted rounded-full flex items-center justify-center">
                            <Bell className="size-9 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-foreground">No notifications yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                You&apos;ll see order confirmations, stock alerts, and report updates here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {notifications.map(notif => {
                            const cfg = TYPE_CONFIG[notif.type] ?? FALLBACK;
                            const isClickable = (notif.entity_type === "order" || notif.entity_type === "report") && notif.entity_id != null;
                            return (
                                <li
                                    key={notif.id}
                                    onClick={() => handleMarkRead(notif)}
                                    className={cn(
                                        "flex items-start gap-4 px-5 py-4 transition-colors",
                                        isClickable ? "cursor-pointer hover:bg-muted/50" : "",
                                        !notif.is_read ? "bg-info/5 hover:bg-info/10" : ""
                                    )}
                                >
                                    <div className="flex items-center self-stretch w-2 shrink-0">
                                        {!notif.is_read && <span className="size-2 rounded-full bg-primary mt-3" />}
                                    </div>
                                    <NotifIcon type={notif.type} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className={cn("text-sm truncate", !notif.is_read ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                <Badge variant="outline" className={cn("text-[10px] font-semibold border-0", cfg.bgClass, cfg.colorClass)}>
                                                    {cfg.label}
                                                </Badge>
                                                {isClickable && <ExternalLink className="size-3.5 text-muted-foreground" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                            <Clock className="size-3" />{fmtDate(notif.created_at)}
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
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} · {total} notifications
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="gap-1">
                            <ChevronLeft className="size-4" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => p === "..." ? (
                                    <span key={`e-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                                ) : (
                                    <button key={p} onClick={() => setPage(p as number)} disabled={loading}
                                        className={cn("size-8 rounded-lg text-sm font-medium transition-colors",
                                            page === p ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted")}>
                                        {p}
                                    </button>
                                ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="gap-1">
                            Next <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
