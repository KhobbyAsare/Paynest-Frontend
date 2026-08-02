"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Phone, MapPin, Save, Info, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { getOrganizationProfileByOrgId, updateOrganizationProfile } from '@/(api-handlers)/organizationProfileHandler';
import { OrganizationResponse } from '@/interfaces/organization';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn, sanitizePhoneNumber } from '@/lib/utils';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

const schema = z.object({
    name:         z.string().min(1, 'Organization name is required'),
    email:        z.string().email('Invalid email format'),
    phone_number: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    address:      z.string().min(1, 'Address is required'),
    description:  z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function OrganizationProfile() {
    const { user } = useAuthStore();
    const organizationId = user?.organization?.id || user?.employee_profile?.organization_id;

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [originalData, setOriginalData] = useState<OrganizationResponse | null>(null);

    const {
        register, handleSubmit, reset, formState: { errors, isDirty },
    } = useForm<FormValues>({ resolver: zodResolver(schema) as Resolver<FormValues> });

    const { onChange: onPhoneNumberChange, ...phoneNumberField } = register('phone_number');

    const fetchProfile = useCallback(async () => {
        if (!organizationId) { setLoading(false); return; }
        setLoading(true);
        try {
            const profile = await getOrganizationProfileByOrgId(organizationId);
            setOriginalData(profile);
            reset({
                name:         profile.name,
                email:        profile.email,
                phone_number: profile.phone_number,
                address:      profile.address,
                description:  profile.description || '',
            });
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to fetch organization profile');
        } finally {
            setLoading(false);
        }
    }, [organizationId, reset]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const onSubmit = async (values: FormValues) => {
        if (!organizationId) return;
        setUpdating(true);
        try {
            await updateOrganizationProfile(organizationId, values as OrganizationResponse);
            toast.success('Organization profile updated successfully');
            fetchProfile();
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    if (!organizationId) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Organization Profile" />
                <div className="flex flex-col items-center py-20 text-center">
                    <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                        <Info className="text-muted-foreground size-7" />
                    </div>
                    <p className="text-foreground font-semibold">Organization not found</p>
                    <p className="text-muted-foreground mt-1 text-sm">Please log in again to continue.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Organization Profile"
                description="Manage and update your organization details."
            />

            {loading ? (
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-48 rounded-2xl" />
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    {/* General Information */}
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="text-primary size-5" /> General Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label>Organization Name <span className="text-destructive">*</span></Label>
                                    <Input {...register('name')} placeholder="Acme Corp" className={cn(errors.name && 'border-destructive')} />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5"><Mail className="size-3.5" /> Contact Email <span className="text-destructive">*</span></Label>
                                    <Input {...register('email')} placeholder="contact@acme.com" className={cn(errors.email && 'border-destructive')} />
                                    {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5"><Phone className="size-3.5" /> Phone Number <span className="text-destructive">*</span></Label>
                                    <Input {...phoneNumberField} type="tel" inputMode="numeric" maxLength={10}
                                        onChange={e => { e.target.value = sanitizePhoneNumber(e.target.value); onPhoneNumberChange(e); }}
                                        placeholder="10-digit phone number" className={cn(errors.phone_number && 'border-destructive')} />
                                    {errors.phone_number && <p className="text-destructive text-xs">{errors.phone_number.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5"><MapPin className="size-3.5" /> Physical Address <span className="text-destructive">*</span></Label>
                                    <Input {...register('address')} placeholder="123 Street, City" className={cn(errors.address && 'border-destructive')} />
                                    {errors.address && <p className="text-destructive text-xs">{errors.address.message}</p>}
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label>Description</Label>
                                    <Textarea {...register('description')} placeholder="A short description of your organization..." className="resize-none" rows={4} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Info (read-only) */}
                    <Card className="bg-muted/30">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Info className="text-muted-foreground size-5" /> Subscription & Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground text-sm mb-5">
                                Subscription details are managed by the platform administrator and cannot be modified here.
                            </p>
                            {originalData?.subscription_expires_at && new Date(originalData.subscription_expires_at) < new Date() && (
                                <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    Your organization&apos;s subscription has expired. Contact the platform administrator to reactivate it.
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: 'Currency',  value: originalData?.currency },
                                    { label: 'Plan',      value: originalData?.subscription_plan?.name },
                                    { label: 'Max Shops', value: String(originalData?.max_shops ?? '—') },
                                    { label: 'Max Users', value: String(originalData?.max_users ?? '—') },
                                ].map(row => (
                                    <div key={row.label} className="space-y-1.5">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">{row.label}</Label>
                                        <div className="bg-muted/50 rounded-md border px-3 py-2 text-sm font-medium capitalize">
                                            {row.value || '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-5" />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'Subscription Expires', value: originalData?.subscription_expires_at ? new Date(originalData.subscription_expires_at).toLocaleString() : 'Never' },
                                    { label: 'Created On',    value: originalData?.created_at ? new Date(originalData.created_at).toLocaleString() : '—' },
                                    { label: 'Last Updated',  value: originalData?.updated_at ? new Date(originalData.updated_at).toLocaleString() : '—' },
                                ].map(row => (
                                    <div key={row.label} className="space-y-1.5">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">{row.label}</Label>
                                        <div className="bg-muted/50 rounded-md border px-3 py-2 text-sm">
                                            {row.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={!isDirty || updating} className="min-w-[170px]">
                            {updating
                                ? <><Loader2 className="mr-2 size-4 animate-spin" /> Updating…</>
                                : <><Save className="mr-2 size-4" /> Update Profile</>
                            }
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
