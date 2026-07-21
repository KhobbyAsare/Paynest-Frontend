"use client"

import { useState } from 'react';
import { changePassword } from '@/(api-handlers)/userHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function getStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-warning' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-info' };
    return { score, label: 'Strong', color: 'bg-success' };
}

const requirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Number (0–9)', test: (p: string) => /[0-9]/.test(p) },
    { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SecuritySettingsPage() {
    const [saving, setSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

    const strength = getStrength(form.new_password);
    const mismatch = !!form.confirm_password && form.confirm_password !== form.new_password;
    const canSubmit = form.current_password && form.new_password.length >= 8 && !mismatch;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mismatch) { toast.error('New passwords do not match'); return; }
        if (form.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return; }
        setSaving(true);
        try {
            await changePassword({ current_password: form.current_password, new_password: form.new_password });
            toast.success('Password changed successfully');
            setForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err: unknown) {
            handleErrorMessage(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Security Settings"
                description="Keep your account secure with a strong password."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ── Form ─────────────────────────────────────────────────── */}
                <Card className="gap-0 p-0 lg:col-span-2">
                    <CardHeader className="border-b px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="size-4.5 text-success" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
                                <p className="text-muted-foreground text-xs mt-0.5">Use a strong, unique password you don&apos;t use elsewhere.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Current */}
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                    <Lock className="size-3.5" /> Current Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        className="bg-background pr-10"
                                        type={showCurrent ? 'text' : 'password'}
                                        value={form.current_password}
                                        onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowCurrent(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New */}
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                    <Lock className="size-3.5" /> New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        className="bg-background pr-10"
                                        type={showNew ? 'text' : 'password'}
                                        value={form.new_password}
                                        onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                                        placeholder="Enter new password"
                                        required minLength={8}
                                    />
                                    <button type="button" onClick={() => setShowNew(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {/* Strength meter */}
                                {form.new_password && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors",
                                                    i <= strength.score ? strength.color : 'bg-muted')} />
                                            ))}
                                        </div>
                                        <p className={cn("text-xs font-medium",
                                            strength.score <= 1 ? 'text-destructive' :
                                                strength.score <= 2 ? 'text-warning-foreground' :
                                                    strength.score <= 3 ? 'text-info' : 'text-success'
                                        )}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm */}
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                    <Lock className="size-3.5" /> Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        className={cn('bg-background pr-10', mismatch && 'border-destructive focus-visible:ring-destructive/30')}
                                        type={showConfirm ? 'text' : 'password'}
                                        value={form.confirm_password}
                                        onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {mismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
                            </div>

                            <div className="border-t pt-5 flex justify-end">
                                <Button type="submit" disabled={saving || !canSubmit} className="min-w-[160px]">
                                    {saving ? 'Changing…' : 'Change Password'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* ── Requirements sidebar ─────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    <Card className="p-0">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold">Password Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4 space-y-2.5">
                            {requirements.map(req => {
                                const met = form.new_password ? req.test(form.new_password) : false;
                                return (
                                    <div key={req.label} className="flex items-center gap-2 text-xs">
                                        {met
                                            ? <CheckCircle2 className="size-3.5 text-success shrink-0" />
                                            : <XCircle className="size-3.5 text-muted-foreground/50 shrink-0" />
                                        }
                                        <span className={cn(met ? 'text-foreground' : 'text-muted-foreground')}>
                                            {req.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="p-0 border-warning/30 bg-warning/5">
                        <CardContent className="px-5 py-4 space-y-2 text-xs text-warning-foreground">
                            <p className="font-semibold">Security Tips</p>
                            <ul className="space-y-1.5 text-muted-foreground">
                                <li>• Never share your password with anyone.</li>
                                <li>• Use a password manager for unique credentials.</li>
                                <li>• Changing your password signs out all other sessions.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
