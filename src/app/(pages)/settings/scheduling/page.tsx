"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { getOvertimeRules, updateOvertimeRules } from '@/(api-handlers)/schedulingHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, Save, Timer } from 'lucide-react';

export default function SchedulingSettingsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const role = (user?.role || '').toLowerCase();
    const isAllowed = role === 'admin' || role === 'superadmin';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dailyThreshold, setDailyThreshold] = useState(8);
    const [weeklyThreshold, setWeeklyThreshold] = useState(40);
    const [multiplier, setMultiplier] = useState(1.5);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (user && !isAllowed) router.replace('/dashboard');
    }, [user, isAllowed, router]);

    const fetchRule = useCallback(async () => {
        setLoading(true);
        try {
            const rule = await getOvertimeRules();
            setDailyThreshold(rule.daily_threshold_hours);
            setWeeklyThreshold(rule.weekly_threshold_hours);
            setMultiplier(rule.multiplier);
            setIsActive(rule.is_active);
        } catch (error) {
            handleErrorMessage(error, 'Failed to load overtime rules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (isAllowed) fetchRule(); }, [isAllowed, fetchRule]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOvertimeRules({
                daily_threshold_hours: dailyThreshold,
                weekly_threshold_hours: weeklyThreshold,
                multiplier,
                is_active: isActive,
            });
            toast.success('Overtime rules saved');
        } catch (error) {
            handleErrorMessage(error, 'Failed to save overtime rules');
        } finally {
            setSaving(false);
        }
    };

    if (!user || !isAllowed) {
        return (
            <div className="flex items-center justify-center py-24">
                <Skeleton className="size-6 rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Overtime Rules"
                description="Set the daily and weekly hour thresholds used to calculate overtime."
            />

            {loading ? (
                <Card className="p-6">
                    <Skeleton className="h-64 w-full" />
                </Card>
            ) : (
                <Card className="gap-0 p-0">
                    <CardHeader className="border-border border-b px-6 py-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                                <Timer className="text-primary size-4" />
                            </div>
                            Overtime Thresholds
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Daily Threshold (hours)</Label>
                                <Input
                                    type="number" min={0} step="0.5"
                                    value={dailyThreshold}
                                    onChange={e => setDailyThreshold(Number(e.target.value))}
                                />
                                <p className="text-muted-foreground text-xs">Hours worked beyond this in a single day count as overtime.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Weekly Threshold (hours)</Label>
                                <Input
                                    type="number" min={0} step="0.5"
                                    value={weeklyThreshold}
                                    onChange={e => setWeeklyThreshold(Number(e.target.value))}
                                />
                                <p className="text-muted-foreground text-xs">Regular hours beyond this in an ISO week count as overtime.</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Overtime Multiplier</Label>
                            <Input
                                type="number" min={1} step="0.1"
                                className="max-w-[160px]"
                                value={multiplier}
                                onChange={e => setMultiplier(Number(e.target.value))}
                            />
                        </div>

                        <div className="border-border flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="text-foreground text-sm font-medium">Overtime rules active</p>
                                <p className="text-muted-foreground text-xs">Turn off to stop applying these thresholds to overtime summaries.</p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>

                        <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-3 text-xs">
                            <Info className="text-info mt-0.5 size-4 shrink-0" />
                            <p>
                                Daily overtime is calculated first, then any remaining regular hours are summed per ISO week (Mon–Sun)
                                and checked against the weekly threshold. One org-wide rule applies to every employee.
                            </p>
                        </div>

                        <div className="flex items-center justify-end border-t pt-5">
                            <Button onClick={handleSave} disabled={saving} className="min-w-[140px] gap-1.5">
                                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
