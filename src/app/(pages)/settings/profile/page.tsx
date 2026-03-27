"use client"

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { getUserData, updateUserProfile } from '@/(api-handlers)/userHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RefreshCcw, User, Mail, Phone, AtSign } from 'lucide-react';

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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 flex items-center justify-center">
                <RefreshCcw className="size-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Profile Settings"
                description="Update your personal information."
            />

            <div className="mt-8 max-w-2xl">
                <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
                    {/* Avatar/info header */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="size-8 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{user?.first_name} {user?.last_name}</p>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 capitalize">
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <User className="size-3.5 text-slate-400" />
                                    First Name
                                </label>
                                <Input
                                    value={form.first_name}
                                    onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                                    placeholder="First name"
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <User className="size-3.5 text-slate-400" />
                                    Last Name
                                </label>
                                <Input
                                    value={form.last_name}
                                    onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                                    placeholder="Last name"
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <AtSign className="size-3.5 text-slate-400" />
                                Username
                            </label>
                            <Input
                                value={form.username}
                                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                                placeholder="Username"
                                className="rounded-lg"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Mail className="size-3.5 text-slate-400" />
                                Email
                            </label>
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400">Email cannot be changed here.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Phone className="size-3.5 text-slate-400" />
                                Phone Number
                            </label>
                            <Input
                                value={form.phone_number}
                                onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))}
                                placeholder="Phone number"
                                className="rounded-lg"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={saving} className="min-w-[120px]">
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCcw className="size-4 animate-spin" />
                                        Saving…
                                    </span>
                                ) : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
