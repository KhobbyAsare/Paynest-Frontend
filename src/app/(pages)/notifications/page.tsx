"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bell, CheckCheck, ShoppingCart, Package, FileText,
    Shield, Clock, RefreshCcw, ArrowRight, Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/(shared-components)/PageHeader";
import Pagination from "@/components/(shared-components)/Pagination";
import {
    getNotifications, markNotificationRead, markAllNotificationsRead, AppNotification,
} from "@/(api-handlers)/notificationsHandler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
    label: string; icon: React.ElementType; color: string; bg: string; border: string;
}> = {
    new_order:     { label: "New Order",     icon: ShoppingCart, color: "text-info",              bg: "bg-info/10",        border: "bg-info" },
    low_stock:     { label: "Low Stock",     icon: Package,      color: "text-warning-foreground", bg: "bg-warning/10",    border: "bg-warning" },
    report_ready:  { label: "Report",        icon: FileText,     color: "text-primary",            bg: "bg-primary/10",    border: "bg-primary" },
    daily_closure: { label: "Daily Closure", icon: Clock,        color: "text-success",            bg: "bg-success/10",    border: "bg-success" },
    system_alert:  { label: "System",        icon: Shield,       color: "text-destructive",        bg: "bg-destructive/10", border: "bg-destructive" },
};
const FALLBACK = { label: "Notification", icon: Bell, color: "text-muted-foreground", bg: "bg-muted", border: "bg-muted-foreground" };

const TYPE_KEYS = Object.keys(TYPE_CONFIG);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)   return "Just now";
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7)   return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function absoluteTime(iso: string): string {
    return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

function getDateGroup(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);
    const itemDay   = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (itemDay.getTime() === today.getTime())     return "Today";
    if (itemDay.getTime() === yesterday.getTime()) return "Yesterday";
    if (itemDay >= weekAgo)                        return "This Week";
    return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Older"];

function groupNotifications(notifications: AppNotification[]) {
    const map: Record<string, AppNotification[]> = {};
    for (const n of notifications) {
        const g = getDateGroup(n.created_at);
        if (!map[g]) map[g] = [];
        map[g].push(n);
    }
    return GROUP_ORDER.filter(g => map[g]).map(g => ({ label: g, items: map[g] }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function NotifRow({
    notif, onMarkRead, onClick,
}: {
    notif: AppNotification;
    onMarkRead: (id: number) => Promise<void>;
    onClick: (notif: AppNotification) => void;
}) {
    const [marking, setMarking] = useState(false);
    const cfg = TYPE_CONFIG[notif.type] ?? FALLBACK;
    const Icon = cfg.icon;
    const isClickable = (notif.entity_type === "order" || notif.entity_type === "report") && notif.entity_id != null;

    const handleMarkRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (notif.is_read || marking) return;
        setMarking(true);
        await onMarkRead(notif.id);
        setMarking(false);
    };

    return (
        <div
            onClick={() => onClick(notif)}
            className={cn(
                "group relative flex items-start gap-0 transition-colors",
                isClickable && "cursor-pointer",
                !notif.is_read ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-muted/40",
            )}
        >
            {/* Unread left border */}
            <div className={cn(
                "absolute left-0 top-0 h-full w-0.5 rounded-r transition-all",
                !notif.is_read ? cfg.border : "bg-transparent"
            )} />

            {/* Unread dot column */}
            <div className="flex w-8 shrink-0 items-center justify-center pt-5 pl-3">
                {!notif.is_read && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                )}
            </div>

            {/* Type icon */}
            <div className="shrink-0 pt-4 pr-1">
                <div className={cn("size-10 rounded-xl flex items-center justify-center", cfg.bg)}>
                    <Icon className={cn("size-5", cfg.color)} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-4 pr-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className={cn(
                            "text-sm leading-snug truncate",
                            !notif.is_read ? "font-semibold text-foreground" : "font-medium text-foreground"
                        )}>
                            {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                        </p>
                    </div>

                    {/* Right meta */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap" title={absoluteTime(notif.created_at)}>
                            {relativeTime(notif.created_at)}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn("text-[10px] font-semibold px-1.5 border-0 rounded-full", cfg.bg, cfg.color)}
                        >
                            {cfg.label}
                        </Badge>
                    </div>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between mt-2">
                    {isClickable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            View {notif.entity_type} <ArrowRight className="size-3" />
                        </span>
                    ) : <span />}

                    {/* Per-row mark-as-read */}
                    {!notif.is_read && (
                        <button
                            onClick={handleMarkRead}
                            disabled={marking}
                            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-medium rounded px-1.5 py-0.5 hover:bg-muted"
                        >
                            <Check className="size-3" /> Mark read
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [total, setTotal]                 = useState(0);
    const [page, setPage]                   = useState(1);
    const [loading, setLoading]             = useState(true);
    const [markingAll, setMarkingAll]       = useState(false);
    const [typeFilter, setTypeFilter]       = useState("all");

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

    const handleMarkRead = async (id: number) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* non-critical */ }
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

    const handleClick = (notif: AppNotification) => {
        if (!notif.is_read) handleMarkRead(notif.id);
        if (notif.entity_type === "order"  && notif.entity_id) router.push(`/orders/${notif.entity_id}`);
        if (notif.entity_type === "report" && notif.entity_id) router.push(`/report/${notif.entity_id}`);
    };

    // Type counts for filter pills
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = { all: notifications.length };
        for (const n of notifications) {
            counts[n.type] = (counts[n.type] ?? 0) + 1;
        }
        return counts;
    }, [notifications]);

    const visible = typeFilter === "all"
        ? notifications
        : notifications.filter(n => n.type === typeFilter);

    const groups = useMemo(() => groupNotifications(visible), [visible]);

    const FILTER_TYPES = [
        { key: "all", label: "All" },
        ...TYPE_KEYS.map(k => ({ key: k, label: TYPE_CONFIG[k].label })),
    ];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Notifications"
                description="Stay on top of orders, stock alerts, and platform events."
            />

            {/* ── Summary + actions ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
                    {/* Unread chip */}
                    <Card className={cn("p-0 transition-colors", unreadCount > 0 ? "border-primary/30 bg-primary/5" : "")}>
                        <CardContent className="px-4 py-3 flex items-center gap-3">
                            <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                                unreadCount > 0 ? "bg-primary/10" : "bg-muted"
                            )}>
                                <Bell className={cn("size-4", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Unread</p>
                                <p className={cn("text-lg font-bold leading-tight", unreadCount > 0 ? "text-primary" : "text-muted-foreground")}>
                                    {unreadCount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total chip */}
                    <Card className="p-0">
                        <CardContent className="px-4 py-3 flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <FileText className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Total</p>
                                <p className="text-lg font-bold leading-tight text-foreground">{total}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline" size="sm"
                        className="gap-1.5"
                        onClick={() => fetchPage(page)}
                        disabled={loading}
                        aria-label="Refresh"
                    >
                        <RefreshCcw className={cn("size-3.5", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline" size="sm"
                            className="gap-1.5"
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Type filter pills ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTER_TYPES.map(t => {
                    const isActive = typeFilter === t.key;
                    const cfg = TYPE_CONFIG[t.key];
                    const count = typeCounts[t.key] ?? 0;
                    const Icon = cfg?.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTypeFilter(t.key)}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                isActive
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                            )}
                        >
                            {Icon && <Icon className="size-3" />}
                            {t.label}
                            {count > 0 && (
                                <span className={cn(
                                    "rounded-full px-1.5 py-0 text-[10px] font-bold min-w-4 text-center",
                                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Feed ─────────────────────────────────────────────────────────── */}
            <Card className="gap-0 overflow-hidden p-0">
                {loading ? (
                    <div className="divide-y">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-4">
                                <Skeleton className="size-2 rounded-full mt-5 shrink-0" />
                                <Skeleton className="size-10 rounded-xl shrink-0 mt-1" />
                                <div className="flex-1 space-y-2 py-1">
                                    <Skeleton className="h-3.5 w-2/5" />
                                    <Skeleton className="h-3 w-3/5" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
                            <Bell className="size-7 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-foreground text-sm">
                                {typeFilter === "all" ? "No notifications yet" : `No ${TYPE_CONFIG[typeFilter]?.label ?? ""} notifications`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                {typeFilter === "all"
                                    ? "Order confirmations, stock alerts, and report updates will appear here."
                                    : "Try a different filter to see more notifications."}
                            </p>
                        </div>
                        {typeFilter !== "all" && (
                            <Button variant="outline" size="sm" onClick={() => setTypeFilter("all")}>
                                Show all notifications
                            </Button>
                        )}
                    </div>
                ) : (
                    <div>
                        {groups.map((group, gi) => (
                            <div key={group.label}>
                                {/* Date group label */}
                                <div className={cn(
                                    "px-5 py-2 flex items-center gap-3",
                                    gi > 0 && "border-t border-border/60"
                                )}>
                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                                        {group.label}
                                    </span>
                                    <div className="flex-1 h-px bg-border/60" />
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                        {group.items.filter(n => !n.is_read).length > 0
                                            ? `${group.items.filter(n => !n.is_read).length} unread`
                                            : `${group.items.length} notification${group.items.length !== 1 ? "s" : ""}`}
                                    </span>
                                </div>

                                {/* Notification rows */}
                                <div className="divide-y divide-border/50">
                                    {group.items.map(notif => (
                                        <NotifRow
                                            key={notif.id}
                                            notif={notif}
                                            onMarkRead={handleMarkRead}
                                            onClick={handleClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {!loading && visible.length > 0 && (
                    <div className="border-t border-border/60 bg-muted/20 px-5 py-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {typeFilter === "all"
                                ? `${total} total · ${unreadCount} unread`
                                : `${visible.length} ${TYPE_CONFIG[typeFilter]?.label ?? ""} on this page`}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="text-xs text-primary hover:underline font-medium disabled:opacity-50"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                )}
            </Card>

            {/* ── Pagination ───────────────────────────────────────────────────── */}
            {totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    isLoading={loading}
                    total={total}
                />
            )}
        </div>
    );
}
