'use client'

import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, UserCog, Loader2, Send } from 'lucide-react'
import PageHeader from '@/components/(shared-components)/PageHeader'
import { onboardOrganizationAndAdmin } from '@/(api-handlers)/organizationHandler'
import { getSubscriptionPlans } from '@/(api-handlers)/subscriptionPlansHandler'
import { SubscriptionPlanResponse } from '@/interfaces/subscriptionPlan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn, sanitizePhoneNumber } from '@/lib/utils'
import { handleErrorMessage } from '@/utils/handleErrorMessage'

const schema = z.object({
    name:              z.string().min(1, 'Organization name is required'),
    email:             z.string().email('Invalid email'),
    phone_number:      z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    currency:          z.string().min(1, 'Currency is required'),
    address:           z.string().min(1, 'Address is required'),
    description:       z.string().optional(),
    subscription_plan_id: z.coerce.number().int().min(1, 'Please select a plan'),
    admin_first_name:  z.string().min(1, 'Required'),
    admin_last_name:   z.string().min(1, 'Required'),
    admin_username:    z.string().min(1, 'Required'),
    admin_email:       z.string().email('Invalid email'),
    admin_phone_number: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits'),
    admin_password:    z.string().min(8, 'Min 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function CreateOrganization() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    const {
        register, handleSubmit, setValue, watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: {
            currency: 'GHS',
        },
    });

    useEffect(() => {
        (async () => {
            setPlansLoading(true);
            try {
                setPlans(await getSubscriptionPlans({ activeOnly: true }));
            } catch (error) {
                handleErrorMessage(error, 'Failed to fetch subscription plans');
            } finally {
                setPlansLoading(false);
            }
        })();
    }, []);

    const { onChange: onPhoneNumberChange, ...phoneNumberField } = register('phone_number');
    const { onChange: onAdminPhoneNumberChange, ...adminPhoneNumberField } = register('admin_phone_number');

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            await onboardOrganizationAndAdmin({ ...values, description: values.description ?? '', is_active: true });
            toast.success('Organization and Admin onboarded successfully', {
                description: 'The admin account cannot sign in until its email is manually verified — no verification email is sent for org onboarding yet.',
                duration: 8000,
            });
            router.push('/organizations');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to onboard organization');
        } finally {
            setLoading(false);
        }
    };

    const subscriptionPlanId = watch('subscription_plan_id');
    const selectedPlan = plans.find(p => p.id === subscriptionPlanId);
    const currency = watch('currency');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push('/organizations')} className="gap-1.5">
                    <ArrowLeft className="size-4" /> Back to Organizations
                </Button>
            </div>

            <PageHeader
                title="Onboard New Organization"
                description="Set up a new organization and its primary administrator account."
            />

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                {/* Organization Information */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="text-primary size-5" /> Organization Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label>Organization Name <span className="text-destructive">*</span></Label>
                                <Input {...register('name')} placeholder="e.g. Acme Corp" className={cn(errors.name && 'border-destructive')} />
                                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Organization Email <span className="text-destructive">*</span></Label>
                                <Input {...register('email')} placeholder="contact@acme.com" className={cn(errors.email && 'border-destructive')} />
                                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Phone Number <span className="text-destructive">*</span></Label>
                                <Input {...phoneNumberField} type="tel" inputMode="numeric" maxLength={10}
                                    onChange={e => { e.target.value = sanitizePhoneNumber(e.target.value); onPhoneNumberChange(e); }}
                                    placeholder="10-digit phone number" className={cn(errors.phone_number && 'border-destructive')} />
                                {errors.phone_number && <p className="text-destructive text-xs">{errors.phone_number.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Currency <span className="text-destructive">*</span></Label>
                                <Select value={currency} onValueChange={v => setValue('currency', v)}>
                                    <SelectTrigger className={cn(errors.currency && 'border-destructive')}>
                                        <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GHS">Ghana Cedi (GHS)</SelectItem>
                                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.currency && <p className="text-destructive text-xs">{errors.currency.message}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label>Physical Address <span className="text-destructive">*</span></Label>
                                <Input {...register('address')} placeholder="Plot 45, Street Name, City" className={cn(errors.address && 'border-destructive')} />
                                {errors.address && <p className="text-destructive text-xs">{errors.address.message}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label>Description</Label>
                                <Textarea {...register('description')} placeholder="A brief description of the organization..." className="resize-none" rows={3} />
                            </div>
                        </div>

                        <Separator className="my-6" />
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-5">Subscription Plan</p>

                        <div className="space-y-1.5">
                            <Label>Plan <span className="text-destructive">*</span></Label>
                            <Select
                                value={subscriptionPlanId ? String(subscriptionPlanId) : undefined}
                                onValueChange={v => setValue('subscription_plan_id', Number(v), { shouldValidate: true })}
                                disabled={plansLoading}
                            >
                                <SelectTrigger className={cn(errors.subscription_plan_id && 'border-destructive')}>
                                    <SelectValue placeholder={plansLoading ? 'Loading plans…' : 'Select a plan'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name} — {p.max_shops} shops / {p.max_users} users
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subscription_plan_id && <p className="text-destructive text-xs">{errors.subscription_plan_id.message}</p>}
                            {!plansLoading && plans.length === 0 && (
                                <p className="text-muted-foreground text-xs">No active plans found. Create one under Subscription Plans first.</p>
                            )}
                        </div>

                        {selectedPlan && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border bg-muted/30 p-4">
                                {[
                                    { label: 'Max Shops', value: selectedPlan.max_shops },
                                    { label: 'Max Users', value: selectedPlan.max_users },
                                    { label: 'Duration', value: selectedPlan.duration_days ? `${selectedPlan.duration_days} days` : 'Never expires' },
                                    { label: 'Price', value: selectedPlan.price != null ? `GHS ${selectedPlan.price}` : '—' },
                                ].map(row => (
                                    <div key={row.label} className="space-y-1">
                                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">{row.label}</p>
                                        <p className="text-sm font-medium text-foreground">{row.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Admin Account */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCog className="text-primary size-5" /> Admin Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label>First Name <span className="text-destructive">*</span></Label>
                                <Input {...register('admin_first_name')} placeholder="John" className={cn(errors.admin_first_name && 'border-destructive')} />
                                {errors.admin_first_name && <p className="text-destructive text-xs">{errors.admin_first_name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Last Name <span className="text-destructive">*</span></Label>
                                <Input {...register('admin_last_name')} placeholder="Doe" className={cn(errors.admin_last_name && 'border-destructive')} />
                                {errors.admin_last_name && <p className="text-destructive text-xs">{errors.admin_last_name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Username <span className="text-destructive">*</span></Label>
                                <Input {...register('admin_username')} placeholder="jdoe_admin" className={cn(errors.admin_username && 'border-destructive')} />
                                {errors.admin_username && <p className="text-destructive text-xs">{errors.admin_username.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Admin Email <span className="text-destructive">*</span></Label>
                                <Input {...register('admin_email')} placeholder="j.doe@example.com" className={cn(errors.admin_email && 'border-destructive')} />
                                {errors.admin_email && <p className="text-destructive text-xs">{errors.admin_email.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Admin Phone <span className="text-destructive">*</span></Label>
                                <Input {...adminPhoneNumberField} type="tel" inputMode="numeric" maxLength={10}
                                    onChange={e => { e.target.value = sanitizePhoneNumber(e.target.value); onAdminPhoneNumberChange(e); }}
                                    placeholder="10-digit phone number" className={cn(errors.admin_phone_number && 'border-destructive')} />
                                {errors.admin_phone_number && <p className="text-destructive text-xs">{errors.admin_phone_number.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Initial Password <span className="text-destructive">*</span></Label>
                                <Input type="password" {...register('admin_password')} placeholder="••••••••" className={cn(errors.admin_password && 'border-destructive')} />
                                {errors.admin_password && <p className="text-destructive text-xs">{errors.admin_password.message}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push('/organizations')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                        {loading ? 'Onboarding…' : 'Onboard Organization'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
