'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, UserCog, Loader2, Send } from 'lucide-react'
import PageHeader from '@/components/(shared-components)/PageHeader'
import { onboardOrganizationAndAdmin } from '@/(api-handlers)/organizationHandler'
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
import { cn } from '@/lib/utils'

const schema = z.object({
    name:              z.string().min(1, 'Organization name is required'),
    email:             z.string().email('Invalid email'),
    phone_number:      z.string().min(1, 'Phone number is required'),
    currency:          z.string().min(1, 'Currency is required'),
    address:           z.string().min(1, 'Address is required'),
    description:       z.string().optional(),
    plan_type:         z.string().min(1, 'Plan type is required'),
    max_shops:         z.coerce.number().int().min(1, 'Min 1 shop'),
    max_users:         z.coerce.number().int().min(1, 'Min 1 user'),
    admin_first_name:  z.string().min(1, 'Required'),
    admin_last_name:   z.string().min(1, 'Required'),
    admin_username:    z.string().min(1, 'Required'),
    admin_email:       z.string().email('Invalid email'),
    admin_phone_number: z.string().min(1, 'Required'),
    admin_password:    z.string().min(8, 'Min 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function CreateOrganization() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const {
        register, handleSubmit, setValue, watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: {
            currency: 'GHS',
            plan_type: 'starter',
            max_shops: 1,
            max_users: 2,
        },
    });

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            await onboardOrganizationAndAdmin({ ...values, description: values.description ?? '', is_active: true });
            toast.success('Organization and Admin onboarded successfully');
            router.push('/organizations');
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Failed to onboard organization');
        } finally {
            setLoading(false);
        }
    };

    const planType = watch('plan_type');
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
                                <Input {...register('phone_number')} placeholder="+233..." className={cn(errors.phone_number && 'border-destructive')} />
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
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-5">Subscription Limits</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <Label>Plan Type <span className="text-destructive">*</span></Label>
                                <Select value={planType} onValueChange={v => setValue('plan_type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="starter">Starter</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.plan_type && <p className="text-destructive text-xs">{errors.plan_type.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Max Shops <span className="text-destructive">*</span></Label>
                                <Input type="number" min={1} {...register('max_shops')} className={cn(errors.max_shops && 'border-destructive')} />
                                {errors.max_shops && <p className="text-destructive text-xs">{errors.max_shops.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Max Users <span className="text-destructive">*</span></Label>
                                <Input type="number" min={1} {...register('max_users')} className={cn(errors.max_users && 'border-destructive')} />
                                {errors.max_users && <p className="text-destructive text-xs">{errors.max_users.message}</p>}
                            </div>
                        </div>
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
                                <Input {...register('admin_phone_number')} placeholder="+233..." className={cn(errors.admin_phone_number && 'border-destructive')} />
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
