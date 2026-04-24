"use client"

import { useState, useEffect } from 'react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { toast } from 'sonner';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '@/(api-handlers)/userHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, ShoppingCart, AlertTriangle, TrendingUp, Users, Package, CheckCircle2 } from 'lucide-react';

interface NotificationSetting {
    id: keyof Omit<NotificationPreferences, 'updated_at'>;
    emailKey: keyof Omit<NotificationPreferences, 'updated_at'>;
    inAppKey: keyof Omit<NotificationPreferences, 'updated_at'>;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const notificationMeta: NotificationSetting[] = [
    {
        id: 'new_order_email',
        emailKey: 'new_order_email',
        inAppKey: 'new_order_in_app',
        title: 'New Orders',
        description: 'Get notified when a new order or walk-in sale is placed.',
        icon: <ShoppingCart className="size-4 text-info" />,
    },
    {
        id: 'low_stock_email',
        emailKey: 'low_stock_email',
        inAppKey: 'low_stock_in_app',
        title: 'Low Stock Alerts',
        description: 'Receive alerts when a product falls below its reorder level.',
        icon: <Package className="size-4 text-warning-foreground" />,
    },
    {
        id: 'daily_closure_email',
        emailKey: 'daily_closure_email',
        inAppKey: 'daily_closure_in_app',
        title: 'Daily Closure Reminders',
        description: 'Reminder to complete the end-of-day closure before closing.',
        icon: <CheckCircle2 className="size-4 text-success" />,
    },
    {
        id: 'report_ready_email',
        emailKey: 'report_ready_email',
        inAppKey: 'report_ready_in_app',
        title: 'Report Ready',
        description: 'Notification when a requested report has been generated.',
        icon: <TrendingUp className="size-4 text-primary" />,
    },
    {
        id: 'user_activity_email',
        emailKey: 'user_activity_email',
        inAppKey: 'user_activity_in_app',
        title: 'User Activity',
        description: 'Alerts for new user registrations or role changes in your org.',
        icon: <Users className="size-4 text-primary" />,
    },
    {
        id: 'system_alerts_email',
        emailKey: 'system_alerts_email',
        inAppKey: 'system_alerts_in_app',
        title: 'System Alerts',
        description: 'Critical system messages and security-related notifications.',
        icon: <AlertTriangle className="size-4 text-destructive" />,
    },
];

const defaultPrefs: Omit<NotificationPreferences, 'updated_at'> = {
    new_order_email: true, new_order_in_app: true,
    low_stock_email: true, low_stock_in_app: true,
    daily_closure_email: false, daily_closure_in_app: true,
    report_ready_email: true, report_ready_in_app: true,
    user_activity_email: false, user_activity_in_app: false,
    system_alerts_email: true, system_alerts_in_app: true,
};

export default function NotificationsSettingsPage() {
    const [prefs, setPrefs] = useState<Omit<NotificationPreferences, 'updated_at'>>(defaultPrefs);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getNotificationPreferences()
            .then((data) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { updated_at, ...rest } = data;
                setPrefs(rest);
            })
            .catch(() => { /* use defaults on error */ })
            .finally(() => setLoading(false));
    }, []);

    const toggle = (key: keyof Omit<NotificationPreferences, 'updated_at'>) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

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

            {/* Channel header */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Notification</span>
                <span className="text-center flex items-center justify-center gap-1">
                    <Mail className="size-3" /> Email
                </span>
                <span className="text-center flex items-center justify-center gap-1">
                    <Bell className="size-3" /> In-App
                </span>
            </div>

            <Card className="rounded-2xl overflow-hidden divide-y">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-4 items-center px-6 py-5">
                            <div className="flex items-start gap-3">
                                <Skeleton className="size-8 rounded-lg shrink-0" />
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
                    notificationMeta.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-4 items-center px-6 py-5">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                </div>
                            </div>

                            <div className="flex sm:justify-center items-center gap-2 sm:gap-0">
                                <span className="text-xs text-muted-foreground sm:hidden">Email:</span>
                                <Switch
                                    checked={prefs[item.emailKey] as boolean}
                                    onCheckedChange={() => toggle(item.emailKey)}
                                />
                            </div>

                            <div className="flex sm:justify-center items-center gap-2 sm:gap-0">
                                <span className="text-xs text-muted-foreground sm:hidden">In-App:</span>
                                <Switch
                                    checked={prefs[item.inAppKey] as boolean}
                                    onCheckedChange={() => toggle(item.inAppKey)}
                                />
                            </div>
                        </div>
                    ))
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
