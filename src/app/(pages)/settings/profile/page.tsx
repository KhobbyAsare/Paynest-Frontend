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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, AtSign } from 'lucide-react';

export default function ProfileSettingsPage() {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        username: '',
    });

    useEffect(() => {
        getUserData()
            .then((data) => {
                setForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone_number: data.phone_number || '',
                    username: data.username || '',
                });
            })
            .catch((err) => handleErrorMessage(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateUserProfile(form);
            if (user) {
                updateUser({ ...user, ...updated });
            }
            toast.success('Profile updated successfully');
        } catch (err: unknown) {
            handleErrorMessage(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Profile Settings"
                description="Update your personal information."
            />

            <Card className="p-6 rounded-2xl">
                {/* Avatar/info header */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="size-8 text-primary" />
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3.5 w-48" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                    ) : (
                        <div>
                            <p className="font-semibold text-foreground">{user?.first_name} {user?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <Badge className="mt-1 border-primary/20 bg-primary/10 text-primary capitalize font-semibold text-xs">
                                {user?.role}
                            </Badge>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-foreground">
                                <User className="size-3.5 text-muted-foreground" />
                                First Name
                            </Label>
                            <Input
                                value={form.first_name}
                                onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                                placeholder="First name"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-foreground">
                                <User className="size-3.5 text-muted-foreground" />
                                Last Name
                            </Label>
                            <Input
                                value={form.last_name}
                                onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                                placeholder="Last name"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-foreground">
                            <AtSign className="size-3.5 text-muted-foreground" />
                            Username
                        </Label>
                        <Input
                            value={form.username}
                            onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                            placeholder="Username"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-foreground">
                            <Mail className="size-3.5 text-muted-foreground" />
                            Email
                        </Label>
                        <Input
                            value={user?.email || ''}
                            disabled
                            className="bg-muted text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-foreground">
                            <Phone className="size-3.5 text-muted-foreground" />
                            Phone Number
                        </Label>
                        <Input
                            value={form.phone_number}
                            onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))}
                            placeholder="Phone number"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={saving || loading} className="min-w-[120px]">
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
