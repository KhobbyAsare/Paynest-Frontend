"use client"

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/(zustand-store)/authStore';
import {
    getUserData, updateUserProfile,
    uploadProfilePicture, removeProfilePicture,
    ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE_BYTES,
} from '@/(api-handlers)/userHandler';
import { handleErrorMessage, getErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    User, Mail, Phone, AtSign, ShieldCheck, CheckCircle2, XCircle, Calendar,
    UserCog, Save, Sparkles, Camera, Trash2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
    superadmin: 'border-purple-500/30 bg-purple-500/10 text-purple-500',
    admin: 'border-info/30 bg-info/10 text-info',
    manager: 'border-success/30 bg-success/10 text-success',
    attendant: 'border-primary/30 bg-primary/10 text-primary',
};

const ROLE_AVATAR: Record<string, string> = {
    superadmin: 'bg-purple-500/10 text-purple-500',
    admin: 'bg-info/10 text-info',
    manager: 'bg-success/10 text-success',
    attendant: 'bg-primary/10 text-primary',
};

const COVER_GRADIENT = 'linear-gradient(135deg, #a47451 0.000%, #9c9881 16.667%, #73a09d 33.333%, #3b899a 50.000%, #095b79 66.667%, #002847 83.333%, #000116 100.000%)';

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
    const [usernameError, setUsernameError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);

    useEffect(() => {
        getUserData()
            .then(data => {
                updateUser(data);
                setForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone_number: data.phone_number || '',
                    username: data.username || '',
                });
            })
            .catch(err => handleErrorMessage(err))
            .finally(() => setLoading(false));
    }, [updateUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUsernameError(null);
        setSaving(true);
        try {
            const updated = await updateUserProfile(form);
            if (user) updateUser({ ...user, ...updated });
            toast.success('Profile updated successfully');
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            if (/username/i.test(message)) {
                setUsernameError(message);
            } else {
                handleErrorMessage(err);
            }
        } finally {
            setSaving(false);
        }
    };

    const uploadAvatar = async (file: File) => {
        const localUrl = URL.createObjectURL(file);
        setAvatarPreview(localUrl);
        setUploadingAvatar(true);
        try {
            const { profile_pic } = await uploadProfilePicture(file);
            if (user) updateUser({ profile_pic });
            toast.success('Profile picture updated');
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 500) {
                toast.error("Couldn't upload your photo. Please try again.", {
                    action: { label: 'Retry', onClick: () => uploadAvatar(file) },
                });
            } else {
                handleErrorMessage(err);
            }
        } finally {
            setUploadingAvatar(false);
            setAvatarPreview(null);
            URL.revokeObjectURL(localUrl);
        }
    };

    const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are supported');
            return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            toast.error('Image must be smaller than 5 MB');
            return;
        }

        uploadAvatar(file);
    };

    const handleRemoveAvatar = async () => {
        setRemovingAvatar(true);
        try {
            await removeProfilePicture();
            if (user) updateUser({ profile_pic: null });
            toast.success('Profile picture removed');
        } catch (err: unknown) {
            handleErrorMessage(err, "Couldn't remove your photo. Please try again.");
        } finally {
            setRemovingAvatar(false);
        }
    };

    const role = user?.role ?? 'attendant';
    const avatarBusy = uploadingAvatar || removingAvatar;
    const avatarSrc = avatarPreview ?? user?.profile_pic ?? undefined;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Profile Settings"
                description="Manage your personal information and account details."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ── Left: Identity card ──────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    <Card className="gap-0 overflow-hidden p-0 shadow-sm">
                        {/* Cover band — signature brand gradient */}
                        <div
                            className="relative h-24 overflow-hidden"
                            style={{ background: COVER_GRADIENT }}
                        >
                            <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/10 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-10 -left-6 size-28 rounded-full bg-white/10 blur-2xl" />
                        </div>
                        <CardContent className="px-6 pb-6 -mt-11">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="size-24 rounded-2xl" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3.5 w-48" />
                                </div>
                            ) : (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarFile}
                                    />
                                    <div className="group relative inline-block">
                                        <Avatar className={cn("size-24 rounded-2xl border-4 border-background shadow-lg", ROLE_AVATAR[role])}>
                                            <AvatarImage src={avatarSrc} alt={`${user?.first_name} ${user?.last_name}`} className="object-cover" />
                                            <AvatarFallback className={cn("rounded-2xl text-2xl font-bold", ROLE_AVATAR[role])}>
                                                {getInitials(user?.first_name, user?.last_name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Hover overlay — change / remove */}
                                        <div
                                            className={cn(
                                                "absolute inset-0 flex items-center justify-center gap-1.5 rounded-2xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100",
                                                avatarBusy && "opacity-100",
                                            )}
                                        >
                                            {avatarBusy ? (
                                                <Loader2 className="size-5 animate-spin text-white" />
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        aria-label="Change profile picture"
                                                        className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                                                    >
                                                        <Camera className="size-4" />
                                                    </button>
                                                    {avatarSrc && (
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveAvatar}
                                                            aria-label="Remove profile picture"
                                                            className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-destructive/80"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-foreground text-lg font-bold leading-tight tracking-tight">
                                            {user?.first_name} {user?.last_name}
                                        </p>
                                        <p className="text-muted-foreground text-sm">{user?.email}</p>
                                        <Badge
                                            variant="outline"
                                            className={cn('mt-2.5 capitalize text-xs font-semibold rounded-full', ROLE_BADGE[role])}
                                        >
                                            {role === 'superadmin' && <ShieldCheck className="mr-1 size-3" />}
                                            {role}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-0 p-0 shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm font-semibold">Account Info</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-border/60 divide-y px-5 py-1">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between py-3">
                                        <Skeleton className="h-3.5 w-20" />
                                        <Skeleton className="h-3.5 w-24" />
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center justify-between py-3 text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2.5">
                                            <span className={cn(
                                                "flex size-7 items-center justify-center rounded-full border",
                                                user?.email_verified
                                                    ? "border-success/30 bg-success/10 text-success"
                                                    : "border-warning/30 bg-warning/10 text-warning-foreground",
                                            )}>
                                                {user?.email_verified
                                                    ? <CheckCircle2 className="size-3.5" />
                                                    : <XCircle className="size-3.5" />}
                                            </span>
                                            Verified
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-full text-xs",
                                                user?.email_verified
                                                    ? "border-success/30 bg-success/10 text-success"
                                                    : "border-warning/30 bg-warning/10 text-warning-foreground",
                                            )}
                                        >
                                            {user?.email_verified ? 'Email confirmed' : 'Not verified'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between py-3 text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2.5">
                                            <span className="border-border bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full border">
                                                <Calendar className="size-3.5" />
                                            </span>
                                            Joined
                                        </span>
                                        <span className="text-foreground text-xs font-medium">{fmtDate(user?.created_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2.5">
                                            <span className="border-border bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full border">
                                                <User className="size-3.5" />
                                            </span>
                                            Username
                                        </span>
                                        <span className="text-foreground text-xs font-medium">{user?.username || '—'}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right: Edit form ──────────────────────────────────────── */}
                <Card className="gap-0 p-0 shadow-sm lg:col-span-2">
                    <CardHeader className="border-b px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                                <UserCog className="size-4" />
                            </span>
                            <div>
                                <CardTitle className="text-sm font-semibold">Edit Information</CardTitle>
                                <p className="text-muted-foreground text-xs">Keep your personal details up to date.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                        First Name
                                    </Label>
                                    <div className="relative">
                                        <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                        <Input
                                            className="bg-background pl-9"
                                            value={form.first_name}
                                            onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                            placeholder="First name"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                        Last Name
                                    </Label>
                                    <div className="relative">
                                        <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                        <Input
                                            className="bg-background pl-9"
                                            value={form.last_name}
                                            onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                            placeholder="Last name"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                    Username
                                </Label>
                                <div className="relative">
                                    <AtSign className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        className={cn('bg-background pl-9', usernameError && 'border-destructive focus-visible:ring-destructive/30')}
                                        value={form.username}
                                        onChange={e => {
                                            setForm(f => ({ ...f, username: e.target.value }));
                                            if (usernameError) setUsernameError(null);
                                        }}
                                        placeholder="Username"
                                        disabled={loading}
                                    />
                                </div>
                                {usernameError && <p className="text-destructive text-xs">{usernameError}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-muted text-muted-foreground cursor-not-allowed pl-9"
                                    />
                                </div>
                                <p className="text-muted-foreground text-xs">Email address cannot be changed here.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                    Phone Number
                                </Label>
                                <div className="relative">
                                    <Phone className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        className="bg-background pl-9"
                                        value={form.phone_number}
                                        onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                                        placeholder="e.g. +233 20 000 0000"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-5">
                                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                    <Sparkles className="size-3.5" /> Changes apply instantly across your account.
                                </p>
                                <Button type="submit" disabled={saving || loading} className="min-w-[140px] gap-1.5">
                                    <Save className="size-4" />
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
