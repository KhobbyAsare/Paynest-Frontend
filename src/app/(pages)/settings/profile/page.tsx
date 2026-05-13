"use client"

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { getUserData, updateUserProfile } from '@/(api-handlers)/userHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, AtSign, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
    superadmin: 'border-[#6f23de]/30 bg-[#6f23de]/10 text-[#6f23de]',
    admin: 'border-info/30 bg-info/10 text-info',
    manager: 'border-success/30 bg-success/10 text-success',
    attendant: 'border-primary/30 bg-primary/10 text-primary',
};

const ROLE_AVATAR: Record<string, string> = {
    superadmin: 'bg-[#6f23de]/10 text-[#6f23de]',
    admin: 'bg-info/10 text-info',
    manager: 'bg-success/10 text-success',
    attendant: 'bg-primary/10 text-primary',
};

function getInitials(first?: string, last?: string) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function fmtDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProfileSettingsPage() {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', username: '' });

    useEffect(() => {
        getUserData()
            .then(data => {
                setForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone_number: data.phone_number || '',
                    username: data.username || '',
                });
            })
            .catch(err => handleErrorMessage(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateUserProfile(form);
            if (user) updateUser({ ...user, ...updated });
            toast.success('Profile updated successfully');
        } catch (err: unknown) {
            handleErrorMessage(err);
        } finally {
            setSaving(false);
        }
    };

    const role = user?.role ?? 'attendant';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Profile Settings"
                description="Manage your personal information and account details."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ── Left: Identity card ──────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    <Card className="p-0 overflow-hidden">
                        {/* Colour band */}
                        <div className={cn("h-20", ROLE_AVATAR[role])} />
                        <CardContent className="px-6 pb-6 -mt-10">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="size-20 rounded-2xl" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3.5 w-48" />
                                </div>
                            ) : (
                                <>
                                    <div className={cn("flex size-20 items-center justify-center rounded-2xl border-4 border-background text-2xl font-bold shadow-sm", ROLE_AVATAR[role])}>
                                        {getInitials(user?.first_name, user?.last_name)}
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-foreground text-lg font-bold leading-tight">
                                            {user?.first_name} {user?.last_name}
                                        </p>
                                        <p className="text-muted-foreground text-sm">{user?.email}</p>
                                        <Badge
                                            variant="outline"
                                            className={cn('mt-2 capitalize text-xs font-semibold rounded-full', ROLE_BADGE[role])}
                                        >
                                            {role === 'superadmin' && <ShieldCheck className="mr-1 size-3" />}
                                            {role}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="p-0">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold">Account Info</CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4 space-y-3">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-3.5 w-20" />
                                        <Skeleton className="h-3.5 w-24" />
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <CheckCircle2 className="size-3.5" /> Verified
                                        </span>
                                        <Badge variant="outline" className="text-xs rounded-full border-success/30 bg-success/10 text-success">
                                            Email confirmed
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="size-3.5" /> Joined
                                        </span>
                                        <span className="text-foreground font-medium text-xs">{fmtDate(user?.created_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <User className="size-3.5" /> Username
                                        </span>
                                        <span className="text-foreground font-medium text-xs">{user?.username || '—'}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right: Edit form ──────────────────────────────────────── */}
                <Card className="gap-0 p-0 lg:col-span-2">
                    <CardHeader className="border-b px-6 py-4">
                        <CardTitle className="text-sm font-semibold">Edit Information</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                        <User className="size-3.5" /> First Name
                                    </Label>
                                    <Input
                                        className="bg-white"
                                        value={form.first_name}
                                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                        placeholder="First name"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                        <User className="size-3.5" /> Last Name
                                    </Label>
                                    <Input
                                        className="bg-white"
                                        value={form.last_name}
                                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                        placeholder="Last name"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                    <AtSign className="size-3.5" /> Username
                                </Label>
                                <Input
                                    className="bg-white"
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder="Username"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                    <Mail className="size-3.5" /> Email Address
                                </Label>
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-muted text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground">Email address cannot be changed here.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                    <Phone className="size-3.5" /> Phone Number
                                </Label>
                                <Input
                                    className="bg-white"
                                    value={form.phone_number}
                                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                                    placeholder="e.g. +233 20 000 0000"
                                    disabled={loading}
                                />
                            </div>

                            <div className="border-t pt-5 flex justify-end">
                                <Button type="submit" disabled={saving || loading} className="min-w-[140px]">
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
