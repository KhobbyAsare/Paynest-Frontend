"use client"

import { useState, useEffect } from 'react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { toast } from 'sonner';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '@/(api-handlers)/userHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, ShoppingCart, AlertTriangle, TrendingUp, Users, Package, CheckCircle2, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationSetting {
    id: keyof Omit<NotificationPreferences, 'updated_at'>;
    emailKey: keyof Omit<NotificationPreferences, 'updated_at'>;
    inAppKey: keyof Omit<NotificationPreferences, 'updated_at'>;
    title: string;
    description: string;
    icon: React.ElementType;
    iconClass: string;
    bgClass: string;
    category: string;
}

const notificationMeta: NotificationSetting[] = [
    {
        id: 'new_order_email', emailKey: 'new_order_email', inAppKey: 'new_order_in_app',
        title: 'New Orders', description: 'Get notified when a new order or walk-in sale is placed.',
        icon: ShoppingCart, iconClass: 'text-info', bgClass: 'bg-info/10', category: 'Sales',
    },
    {
        id: 'low_stock_email', emailKey: 'low_stock_email', inAppKey: 'low_stock_in_app',
        title: 'Low Stock Alerts', description: 'Receive alerts when a product falls below its reorder level.',
        icon: Package, iconClass: 'text-warning-foreground', bgClass: 'bg-warning/10', category: 'Inventory',
    },
    {
        id: 'daily_closure_email', emailKey: 'daily_closure_email', inAppKey: 'daily_closure_in_app',
        title: 'Daily Closure Reminders', description: 'Reminder to complete the end-of-day closure before closing.',
        icon: CheckCircle2, iconClass: 'text-success', bgClass: 'bg-success/10', category: 'Operations',
    },
    {
        id: 'report_ready_email', emailKey: 'report_ready_email', inAppKey: 'report_ready_in_app',
        title: 'Report Ready', description: 'Notification when a requested report has been generated.',
        icon: TrendingUp, iconClass: 'text-primary', bgClass: 'bg-primary/10', category: 'Reports',
    },
    {
        id: 'user_activity_email', emailKey: 'user_activity_email', inAppKey: 'user_activity_in_app',
        title: 'User Activity', description: 'Alerts for new user registrations or role changes in your org.',
        icon: Users, iconClass: 'text-primary', bgClass: 'bg-primary/10', category: 'Users',
    },
    {
        id: 'system_alerts_email', emailKey: 'system_alerts_email', inAppKey: 'system_alerts_in_app',
        title: 'System Alerts', description: 'Critical system messages and security-related notifications.',
        icon: AlertTriangle, iconClass: 'text-destructive', bgClass: 'bg-destructive/10', category: 'System',
    },
    {
        id: 'payslip_ready_email', emailKey: 'payslip_ready_email', inAppKey: 'payslip_ready_in_app',
        title: 'Payslip Ready', description: 'Notification when your payslip has been generated and is ready to view.',
        icon: Banknote, iconClass: 'text-success', bgClass: 'bg-success/10', category: 'Payroll',
    },
];

const defaultPrefs: Omit<NotificationPreferences, 'updated_at'> = {
    new_order_email: true, new_order_in_app: true,
    low_stock_email: true, low_stock_in_app: true,
    daily_closure_email: false, daily_closure_in_app: true,
    report_ready_email: true, report_ready_in_app: true,
    user_activity_email: false, user_activity_in_app: false,
    system_alerts_email: true, system_alerts_in_app: true,
    payslip_ready_email: true, payslip_ready_in_app: true,
};

export default function NotificationsSettingsPage() {
    const [prefs, setPrefs] = useState<Omit<NotificationPreferences, 'updated_at'>>(defaultPrefs);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getNotificationPreferences()
            .then(data => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { updated_at, ...rest } = data;
                setPrefs(rest);
            })
            .catch(() => { /* use defaults on error */ })
            .finally(() => setLoading(false));
    }, []);

    const toggle = (key: keyof Omit<NotificationPreferences, 'updated_at'>) =>
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

    const enabledCount = notificationMeta.reduce((n, item) => {
        return n + (prefs[item.emailKey] ? 1 : 0) + (prefs[item.inAppKey] ? 1 : 0);
    }, 0);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNotificationPreferences(prefs);
            toast.success('Notification preferences saved');
        } catch (err) {
            handleErrorMessage(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Notification Preferences"
                description="Choose how and when you want to be notified."
            />

            {/* ── Summary banner ──────────────────────────────────────────── */}
            <Card className="border-primary/20 bg-primary/5 p-0">
                <CardContent className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Bell className="size-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {enabledCount} of {notificationMeta.length * 2} channels enabled
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Across {notificationMeta.length} notification types
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs shrink-0">
                        {Math.round((enabledCount / (notificationMeta.length * 2)) * 100)}% active
                    </Badge>
                </CardContent>
            </Card>

            {/* ── Column headers ──────────────────────────────────────────── */}
            <div className="hidden sm:grid grid-cols-[1fr_88px_88px] gap-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Notification Type</span>
                <span className="text-center flex items-center justify-center gap-1.5">
                    <Mail className="size-3" /> Email
                </span>
                <span className="text-center flex items-center justify-center gap-1.5">
                    <Bell className="size-3" /> In-App
                </span>
            </div>

            {/* ── Rows ────────────────────────────────────────────────────── */}
            <Card className="rounded-2xl overflow-hidden divide-y p-0">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_88px_88px] gap-4 items-center px-6 py-5">
                            <div className="flex items-start gap-3">
                                <Skeleton className="size-9 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3.5 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-9 rounded-full mx-auto" />
                            <Skeleton className="h-5 w-9 rounded-full mx-auto" />
                        </div>
                    ))
                ) : (
                    notificationMeta.map((item) => {
                        const Icon = item.icon;
                        const emailOn  = prefs[item.emailKey] as boolean;
                        const inAppOn  = prefs[item.inAppKey] as boolean;
                        return (
                            <div key={item.id} className={cn(
                                "grid grid-cols-1 sm:grid-cols-[1fr_88px_88px] gap-4 items-center px-6 py-4 transition-colors",
                                (emailOn || inAppOn) ? "hover:bg-muted/30" : "hover:bg-muted/20 opacity-75"
                            )}>
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-0.5 size-9 rounded-lg flex items-center justify-center shrink-0", item.bgClass)}>
                                        <Icon className={cn("size-4", item.iconClass)} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                                            <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground border-border px-1.5 py-0 rounded-full">
                                                {item.category}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                    </div>
                                </div>

                                <div className="flex sm:justify-center items-center gap-2 sm:gap-0">
                                    <span className="text-xs text-muted-foreground sm:hidden w-12">Email</span>
                                    <Switch checked={emailOn} onCheckedChange={() => toggle(item.emailKey)} />
                                </div>

                                <div className="flex sm:justify-center items-center gap-2 sm:gap-0">
                                    <span className="text-xs text-muted-foreground sm:hidden w-12">In-App</span>
                                    <Switch checked={inAppOn} onCheckedChange={() => toggle(item.inAppKey)} />
                                </div>
                            </div>
                        );
                    })
                )}
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving || loading} className="min-w-[140px]">
                    {saving ? 'Saving…' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
}
