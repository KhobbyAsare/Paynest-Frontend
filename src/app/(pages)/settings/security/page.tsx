"use client"

import { useState } from 'react';
import { changePassword } from '@/(api-handlers)/userHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import PageHeader from '@/components/(shared-components)/PageHeader';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RefreshCcw, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function SecuritySettingsPage() {
    const [saving, setSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }
        if (form.new_password.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        setSaving(true);
        try {
            await changePassword({
                current_password: form.current_password,
                new_password: form.new_password,
            });
            toast.success('Password changed successfully');
            setForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err: unknown) {
            toast.error(handleErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <PageHeader
                title="Security Settings"
                description="Manage your password and account security."
            />

            <div className="mt-8 max-w-2xl">
                <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                        <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                            <ShieldCheck className="size-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">Change Password</p>
                            <p className="text-sm text-slate-500">Use a strong password with at least 8 characters.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Lock className="size-3.5 text-slate-400" />
                                Current Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={form.current_password}
                                    onChange={(e) => setForm(f => ({ ...f, current_password: e.target.value }))}
                                    placeholder="Enter current password"
                                    className="rounded-lg pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Lock className="size-3.5 text-slate-400" />
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    value={form.new_password}
                                    onChange={(e) => setForm(f => ({ ...f, new_password: e.target.value }))}
                                    placeholder="Enter new password"
                                    className="rounded-lg pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Lock className="size-3.5 text-slate-400" />
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={form.confirm_password}
                                    onChange={(e) => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                                    placeholder="Confirm new password"
                                    className={`rounded-lg pr-10 ${
                                        form.confirm_password && form.confirm_password !== form.new_password
                                            ? 'border-rose-300 focus:ring-rose-200'
                                            : ''
                                    }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {form.confirm_password && form.confirm_password !== form.new_password && (
                                <p className="text-xs text-rose-500">Passwords do not match</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={saving || (!!form.confirm_password && form.confirm_password !== form.new_password)}
                                className="min-w-[160px]"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCcw className="size-4 animate-spin" />
                                        Changing…
                                    </span>
                                ) : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
