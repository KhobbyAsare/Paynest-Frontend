"use client"

import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Users, Store, Loader2 } from 'lucide-react';
import PageHeader from '@/components/(shared-components)/PageHeader';
import { getOrganizationUsers } from '@/(api-handlers)/userHandler';
import { createEmployeeProfile } from '@/(api-handlers)/employeeProfileHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import { EmployeeProfileRequest } from '@/interfaces/employeeProfile';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const schema = z.object({
    user_id:            z.number().min(1, 'Please select a user'),
    employee_code:      z.string().min(1, 'Employee code is required'),
    department:         z.string().optional(),
    job_title:          z.string().min(1, 'Job title is required'),
    hire_date:          z.string().optional(),
    employment_type:    z.string().optional(),
    employment_status:  z.string().optional(),
    work_email:         z.string().optional(),
    work_phone:         z.string().optional(),
    shop_id:            z.coerce.number().min(1, 'Please assign a shop'),
    role:               z.string().min(1, 'Role is required'),
    can_create_shop:    z.boolean().default(false),
    can_manage_users:   z.boolean().default(false),
    can_view_reports:   z.boolean().default(false),
    can_manage_inventory: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;

export default function SetUpEmployeeProfile() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const {
        register, handleSubmit, control, setValue, watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: {
            employment_type:   'full_time',
            employment_status: 'active',
            role:              'attendant',
            shop_id:           1,
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [usersData, shopsData] = await Promise.all([
                    getOrganizationUsers(),
                    getOrganizationShops(),
                ]);
                setUsers(usersData);
                setShops(shopsData);
            } catch (error) {
                handleErrorMessage(error, 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const usersWithoutProfile = useMemo(() => users.filter(u => !u.employee_profile), [users]);
    const selectedUserInfo = useMemo(() => users.find(u => u.id === selectedUserId), [selectedUserId, users]);

    const handleUserSelect = (userId: number) => {
        setSelectedUserId(userId);
        setValue('user_id', userId);
        const u = users.find(x => x.id === userId);
        if (u) setValue('role', u.role || 'attendant');
    };

    const onSubmit = async (values: FormValues) => {
        if (!currentUser?.organization?.id) {
            toast.error('Missing organization information');
            return;
        }
        try {
            const requestData: EmployeeProfileRequest = {
                ...values,
                organization_id: currentUser.organization.id,
                hire_date: values.hire_date ? values.hire_date : '',
                termination_date: '',
            } as EmployeeProfileRequest;
            await createEmployeeProfile(requestData);
            toast.success('Employee profile set up successfully!');
            router.push('/users');
        } catch (error) {
            handleErrorMessage(error, 'Failed to set up employee profile');
        }
    };

    const userIdValue = watch('user_id');

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-12 w-64 rounded" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
                    <ArrowLeft className="size-4" /> Back
                </Button>
            </div>

            <PageHeader
                title="Setup Employee Profile"
                description="Create a professional profile for an existing organization user."
            />

            {/* User selection */}
            <Card>
                <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="space-y-1.5">
                                <Label className="font-semibold">Select User <span className="text-destructive">*</span></Label>
                                <p className="text-muted-foreground text-xs">
                                    Choose a user who does not yet have an employee profile.
                                </p>
                                <Select
                                    value={selectedUserId ? String(selectedUserId) : ''}
                                    onValueChange={v => handleUserSelect(Number(v))}
                                >
                                    <SelectTrigger className={cn(!userIdValue && errors.user_id && 'border-destructive')}>
                                        <SelectValue placeholder="Search and select a user…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {usersWithoutProfile.length === 0 ? (
                                            <div className="px-4 py-3 text-muted-foreground text-sm text-center">
                                                All users already have profiles.
                                            </div>
                                        ) : usersWithoutProfile.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.first_name} {u.last_name} ({u.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && <p className="text-destructive text-xs">{errors.user_id.message}</p>}
                            </div>
                        </div>

                        {selectedUserInfo && (
                            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4 min-w-[280px]">
                                <Avatar className="size-14">
                                    <AvatarImage src={selectedUserInfo.profile_pic} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {selectedUserInfo.first_name[0]}{selectedUserInfo.last_name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-foreground font-semibold">
                                        {selectedUserInfo.first_name} {selectedUserInfo.last_name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">{selectedUserInfo.email}</p>
                                    <Badge variant="outline" className="mt-1.5 capitalize rounded-full text-xs border-primary/20 bg-primary/10 text-primary">
                                        {selectedUserInfo.role}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedUserId && (
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Main column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-base">Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5">
                                    <Label>Employee Code <span className="text-destructive">*</span></Label>
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
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="full_time">Full-time</SelectItem>
                                                    <SelectItem value="part_time">Part-time</SelectItem>
                                                    <SelectItem value="contract">Contract</SelectItem>
                                                    <SelectItem value="freelance">Freelance</SelectItem>
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
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="probation">Probation</SelectItem>
                                                    <SelectItem value="on-leave">On Leave</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-base">Work Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5">
                                    <Label>Work Email</Label>
                                    <Input {...register('work_email')} placeholder="work@organization.com" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Work Phone</Label>
                                    <Input {...register('work_phone')} placeholder="Official contact number" />
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
                                                    <SelectValue placeholder="Select shop" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {shops.map(s => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.name} ({s.location})
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

                    {/* Permissions sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-base">Permissions & Role</CardTitle>
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
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="attendant">Attendant</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <p className="text-muted-foreground text-xs">This overrides the user&apos;s current system role.</p>
                                    {errors.role && <p className="text-destructive text-xs">{errors.role.message}</p>}
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <p className="text-foreground text-sm font-semibold">Specific Access</p>
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

                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-start gap-2 mb-3">
                                <Users className="text-primary size-4 mt-0.5 shrink-0" />
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Setting up a profile enables performance tracking, assignment management, and access control for this user.
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting
                                    ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</>
                                    : <><Save className="mr-2 size-4" /> Create Profile</>
                                }
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
