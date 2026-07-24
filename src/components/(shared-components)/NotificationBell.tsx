"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/(zustand-store)/authStore";
import {
    type AppNotification,
    createNotificationStream,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "@/(api-handlers)/notificationsHandler";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NOTIF_TYPE_LABELS: Record<string, string> = {
    new_order: "New Order",
    low_stock: "Low Stock",
    report_ready: "Report",
    daily_closure: "Daily Closure",
    system_alert: "System",
};

const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

interface NotificationBellProps {
    triggerClassName?: string;
}

export function NotificationBell({ triggerClassName }: NotificationBellProps) {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const [open, setOpen] = React.useState(false);
    const [notifications, setNotifications] = React.useState<AppNotification[]>(
        [],
    );
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        if (!accessToken) return;

        const fetchNotifs = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            } catch {
                /* silent — background poll */
            }
        };

        fetchNotifs();

        let es: EventSource | null = null;
        let fallbackInterval: ReturnType<typeof setInterval> | null = null;

        try {
            es = createNotificationStream(
                accessToken,
                (incoming) => {
                    setNotifications((prev) => {
                        const existingIds = new Set(prev.map((n) => n.id));
                        const fresh = incoming.filter((n) => !existingIds.has(n.id));
                        return [...fresh, ...prev].slice(0, 15);
                    });
                    const newUnread = incoming.filter((n) => !n.is_read).length;
                    if (newUnread > 0) setUnreadCount((prev) => prev + newUnread);
                },
                () => {
                    if (!fallbackInterval) {
                        fallbackInterval = setInterval(fetchNotifs, 20_000);
                    }
                },
            );
        } catch {
            fallbackInterval = setInterval(fetchNotifs, 20_000);
        }

        const onVisible = () => {
            if (document.visibilityState === "visible") fetchNotifs();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            es?.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [accessToken]);

    const handleNotifClick = async (notif: AppNotification) => {
        if (!notif.is_read) {
            try {
                await markNotificationRead(notif.id);
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notif.id ? { ...n, is_read: true } : n,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
                /* ignore */
            }
        }
        if (notif.entity_type === "order" && notif.entity_id) {
            router.push(`/orders/${notif.entity_id}`);
            setOpen(false);
        } else if (notif.entity_type === "report" && notif.entity_id) {
            router.push(`/report/${notif.entity_id}`);
            setOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            toast.error("Failed to mark all as read");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
                    className={cn("relative", triggerClassName)}
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 ? (
                        <span
                            aria-hidden="true"
                            className="bg-destructive text-destructive-foreground ring-background absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[20rem] p-0"
            >
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-7 gap-1 px-2 text-xs"
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </Button>
                    ) : null}
                </div>
                <Separator />

                <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                            No notifications yet
                        </p>
                    ) : (
                        <ul className="divide-border divide-y">
                            {notifications.map((notif) => (
                                <li key={notif.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleNotifClick(notif)}
                                        className={cn(
                                            "hover:bg-accent w-full px-4 py-3 text-left transition-colors",
                                            !notif.is_read && "bg-info-muted/40",
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!notif.is_read ? (
                                                <span
                                                    aria-hidden="true"
                                                    className="bg-info mt-1.5 size-2 shrink-0 rounded-full"
                                                />
                                            ) : (
                                                <span className="mt-1.5 size-2 shrink-0" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        "text-foreground truncate text-xs",
                                                        !notif.is_read
                                                            ? "font-semibold"
                                                            : "font-medium",
                                                    )}
                                                >
                                                    {notif.title}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {notif.message}
                                                </p>
                                                <p className="text-muted-foreground/80 mt-0.5 text-[10px]">
                                                    {NOTIF_TYPE_LABELS[notif.type] ?? notif.type}
                                                    {" · "}
                                                    {formatTime(notif.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>

                <Separator />
                <div className="flex items-center justify-between px-4 py-2">
                    <Link
                        href="/notifications"
                        onClick={() => setOpen(false)}
                        className="text-primary text-xs font-medium hover:underline"
                    >
                        View all notifications →
                    </Link>
                    <Link
                        href="/settings/notifications"
                        onClick={() => setOpen(false)}
                        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                    >
                        Settings
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default NotificationBell;
