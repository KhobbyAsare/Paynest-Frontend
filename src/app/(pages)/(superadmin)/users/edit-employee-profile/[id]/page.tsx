"use client"

import { useEffect, useState, use } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Briefcase, Key, Mail, Fingerprint,
    MapPin, Loader2, Store,
} from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { getUserByID } from '@/(api-handlers)/userHandler';
import { updateEmployeeProfile } from '@/(api-handlers)/employeeProfileHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn, sanitizePhoneNumber } from '@/lib/utils';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const schema = z.object({
    employee_code:      z.string().min(1, 'Required'),
    department:         z.string().optional(),
    job_title:          z.string().min(1, 'Required'),
    hire_date:          z.string().optional(),
    employment_type:    z.string().optional(),
    employment_status:  z.string().optional(),
    work_email:         z.string().optional(),
    work_phone:         z.string().regex(/^\d{10}$/, 'Work phone must be exactly 10 digits').or(z.literal('')).optional(),
    shop_id:            z.coerce.number().min(1, 'Please assign a shop'),
    role:               z.string().min(1, 'Required'),
    can_create_shop:    z.boolean().default(false),
    can_manage_users:   z.boolean().default(false),
    can_view_reports:   z.boolean().default(false),
    can_manage_inventory: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;

interface EditEmployeeProfileProps {
    params: Promise<{ id: string }>;
}

export default function EditEmployeeProfile({ params }: EditEmployeeProfileProps) {
    const { id } = use(params);
    const router = useRouter();
    useAuthStore();

    const [userData, setUserData] = useState<UserResponse | null>(null);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        register, handleSubmit, control, setValue, reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) as Resolver<FormValues> });

    const { onChange: onWorkPhoneChange, ...workPhoneField } = register('work_phone');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userRes, shopsRes] = await Promise.all([
                    getUserByID(id),
                    getOrganizationShops(),
                ]);
                setUserData(userRes);
                setShops(shopsRes);

                if (userRes.employee_profile) {
                    const ep = userRes.employee_profile;
                    reset({
                        employee_code:      ep.employee_code || '',
                        department:         ep.department || '',
                        job_title:          ep.job_title || '',
                        hire_date:          ep.hire_date ? ep.hire_date.split('T')[0] : '',
                        employment_type:    ep.employment_type || '',
                        employment_status:  ep.employment_status || '',
                        work_email:         ep.work_email || '',
                        work_phone:         ep.work_phone || '',
                        shop_id:            ep.shop_id || 0,
                        role:               userRes.role || '',
                        can_create_shop:    !!ep.can_create_shop,
                        can_manage_users:   !!ep.can_manage_users,
                        can_view_reports:   !!ep.can_view_reports,
                        can_manage_inventory: !!ep.can_manage_inventory,
                    });
                } else {
                    toast.warning('This user has no employee profile. Redirecting to setup...');
                    router.push('/users/setup-employee-profile');
                }
            } catch (error) {
                handleErrorMessage(error, 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, reset, router]);

    const onSubmit = async (values: FormValues) => {
        try {
            await updateEmployeeProfile(parseInt(id), {
                ...values,
                hire_date: values.hire_date ? new Date(values.hire_date).toISOString() : '',
                termination_date: '',
            });
            toast.success('Employee profile updated successfully!');
            router.push(`/users/${id}`);
        } catch (error) {
            handleErrorMessage(error, 'Failed to update employee profile');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-12 w-64 rounded" />
                <Skeleton className="h-24 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-48 rounded-2xl" />
                    </div>
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex flex-col gap-6 items-center py-20">
                <p className="text-foreground text-xl font-semibold">User Not Found</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
                    <ArrowLeft className="size-4" /> Back to Profile
                </Button>
            </div>

            <PageHeader
                title="Edit Employment Data"
                description={`Modify access and professional details for ${userData.first_name}.`}
            />

            {/* Profile snapshot */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <Avatar className="size-16">
                            <AvatarImage src={userData.profile_pic ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                {userData.first_name[0]}{userData.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h2 className="text-foreground text-xl font-semibold tracking-tight">
                                    {userData.first_name} {userData.last_name}
                                </h2>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "rounded-full text-xs",
                                        userData.is_active
                                            ? "border-success/30 bg-success/10 text-success"
                                            : "border-border bg-muted text-muted-foreground"
                                    )}
                                >
                                    {userData.is_active ? 'Active' : 'Deactivated'}
                                </Badge>
                            </div>
                            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5"><Mail className="size-3.5" /> {userData.email}</div>
                                <div className="flex items-center gap-1.5"><Fingerprint className="size-3.5" /> {userData.username}</div>
                                <Badge variant="outline" className="capitalize rounded-full text-[10px] font-medium tracking-wider">
                                    {userData.role}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Briefcase className="text-muted-foreground size-4" /> Operational Context
                            </CardTitle>
                            <CardDescription>Professional assignment and role details.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label>Identity Code <span className="text-destructive">*</span></Label>
                                <Input {...register('employee_code')} placeholder="e.g. EMP-001" className={cn(errors.employee_code && 'border-destructive')} />
                                {errors.employee_code && <p className="text-destructive text-xs">{errors.employee_code.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Department</Label>
                                <Input {...register('department')} placeholder="e.g. Sales, Inventory" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Job Title <span className="text-destructive">*</span></Label>
                                <Input {...register('job_title')} placeholder="e.g. Store Manager" className={cn(errors.job_title && 'border-destructive')} />
                                {errors.job_title && <p className="text-destructive text-xs">{errors.job_title.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Hire Date</Label>
                                <Controller
                                    control={control}
                                    name="hire_date"
                                    render={({ field }) => (
                                        <DatePicker
                                            value={field.value ? dayjs(field.value) : null}
                                            onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                                            format="DD MMM YYYY"
                                            className="h-9 w-full"
                                        />
                                    )}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Employment Type</Label>
                                <Controller
                                    control={control}
                                    name="employment_type"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full_time">Full-time Employee</SelectItem>
                                                <SelectItem value="part_time">Part-time Coverage</SelectItem>
                                                <SelectItem value="contract">Independent Contract</SelectItem>
                                                <SelectItem value="freelance">Freelance Retainer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Employment Status</Label>
                                <Controller
                                    control={control}
                                    name="employment_status"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="probation">Probationary Period</SelectItem>
                                                <SelectItem value="on-leave">On Approved Leave</SelectItem>
                                                <SelectItem value="terminated">Terminated</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="text-muted-foreground size-4" /> Station Details
                            </CardTitle>
                            <CardDescription>Contact channels and shop assignment.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label>Work Email</Label>
                                <Input {...register('work_email')} placeholder="work@organization.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Work Phone</Label>
                                <Input {...workPhoneField} type="tel" inputMode="numeric" maxLength={10}
                                    onChange={e => { e.target.value = sanitizePhoneNumber(e.target.value); onWorkPhoneChange(e); }}
                                    placeholder="10-digit contact number" className={cn(errors.work_phone && 'border-destructive')} />
                                {errors.work_phone && <p className="text-destructive text-xs">{errors.work_phone.message}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <Store className="size-3.5" /> Assigned Shop <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    control={control}
                                    name="shop_id"
                                    render={({ field }) => (
                                        <Select value={String(field.value || '')} onValueChange={v => field.onChange(Number(v))}>
                                            <SelectTrigger className={cn(errors.shop_id && 'border-destructive')}>
                                                <SelectValue placeholder="Select operational facility" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shops.map(shop => (
                                                    <SelectItem key={shop.id} value={String(shop.id)}>
                                                        {shop.name} ({shop.location})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.shop_id && <p className="text-destructive text-xs">{errors.shop_id.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Security sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Key className="text-muted-foreground size-4" /> Clearance Protocol
                            </CardTitle>
                            <CardDescription>System access restrictions.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-5">
                            <div className="space-y-1.5">
                                <Label>System Role <span className="text-destructive">*</span></Label>
                                <Controller
                                    control={control}
                                    name="role"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className={cn(errors.role && 'border-destructive')}>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="attendant">Attendant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.role && <p className="text-destructive text-xs">{errors.role.message}</p>}
                            </div>

                            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                                <p className="text-warning-foreground text-sm">
                                    Modifying the role propagates immediately across all instances.
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <p className="text-muted-foreground text-sm font-semibold">Action Grants</p>
                                {[
                                    { name: 'can_create_shop' as const,    label: 'Can Create Shop' },
                                    { name: 'can_manage_users' as const,   label: 'Can Manage Users' },
                                    { name: 'can_view_reports' as const,   label: 'Can View Reports' },
                                    { name: 'can_manage_inventory' as const, label: 'Can Manage Inventory' },
                                ].map(item => (
                                    <Controller
                                        key={item.name}
                                        control={control}
                                        name={item.name}
                                        render={({ field }) => (
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={item.name}
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                                <label htmlFor={item.name} className="text-foreground cursor-pointer text-sm font-medium">
                                                    {item.label}
                                                </label>
                                            </div>
                                        )}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Button className="w-full" type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving…</>
                            : <><Save className="mr-2 size-4" /> Save Profile Changes</>
                        }
                    </Button>
                </div>
            </form>
        </div>
    );
}
