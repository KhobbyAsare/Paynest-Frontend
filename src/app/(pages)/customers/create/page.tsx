"use client"

import { useState } from 'react';
import {
    User, Mail, Phone, MapPin,
    Save, X, ArrowLeft, Star,
    CreditCard, MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateCustomer } from '@/(api-handlers)/customersHandler';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

interface FormValues {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    notes: string;
    customer_code: string;
    is_active: boolean;
    loyalty_tier: string;
    loyalty_points: string;
    preferred_payment_method: string;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    customer_code?: string;
}

const defaultValues: FormValues = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Other',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    notes: '',
    customer_code: '',
    is_active: true,
    loyalty_tier: 'Standard',
    loyalty_points: '0',
    preferred_payment_method: 'Cash',
};

function FieldLabel({ children, required }: Readonly<{ children: React.ReactNode; required?: boolean }>) {
    return (
        <label className="block text-sm font-medium text-foreground mb-1.5">
            {children}
            {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
    );
}

function FieldError({ message }: Readonly<{ message?: string }>) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function CreateCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState<FormValues>(defaultValues);
    const [errors, setErrors] = useState<FormErrors>({});

    function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues(prev => ({ ...prev, [key]: value }));
        if (errors[key as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    }

    function validate(): boolean {
        const e: FormErrors = {};
        if (!values.first_name.trim()) e.first_name = 'First name is required';
        if (!values.last_name.trim()) e.last_name = 'Last name is required';
        if (!values.phone.trim()) e.phone = 'Phone number is required';
        if (!values.customer_code.trim()) e.customer_code = 'Customer code is required';
        if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            e.email = 'Enter a valid email address';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await CreateCustomer({
                ...values,
                loyalty_points: Number(values.loyalty_points),
                date_of_birth: values.date_of_birth,
                communication_preferences: { additionalProp1: 'email' },
            });
            toast.success('Customer profile created successfully');
            router.push('/customers');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb + Heading */}
            <div>
                <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link href="/customers" className="hover:text-foreground transition-colors">Customers</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Add New Customer</span>
                </nav>

                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Profile</h1>
                        <p className="text-muted-foreground text-sm">Onboard a new customer to the platform database.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="size-4 text-primary" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel required>First Name</FieldLabel>
                                        <Input
                                            placeholder="John"
                                            value={values.first_name}
                                            onChange={e => set('first_name', e.target.value)}
                                            className={cn(errors.first_name && 'border-destructive')}
                                        />
                                        <FieldError message={errors.first_name} />
                                    </div>
                                    <div>
                                        <FieldLabel required>Last Name</FieldLabel>
                                        <Input
                                            placeholder="Doe"
                                            value={values.last_name}
                                            onChange={e => set('last_name', e.target.value)}
                                            className={cn(errors.last_name && 'border-destructive')}
                                        />
                                        <FieldError message={errors.last_name} />
                                    </div>
                                    <div>
                                        <FieldLabel>Email Address</FieldLabel>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                type="email"
                                                placeholder="john@example.com"
                                                value={values.email}
                                                onChange={e => set('email', e.target.value)}
                                                className={cn('pl-9', errors.email && 'border-destructive')}
                                            />
                                        </div>
                                        <FieldError message={errors.email} />
                                    </div>
                                    <div>
                                        <FieldLabel required>Phone Number</FieldLabel>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                placeholder="+1 234 567 890"
                                                value={values.phone}
                                                onChange={e => set('phone', e.target.value)}
                                                className={cn('pl-9', errors.phone && 'border-destructive')}
                                            />
                                        </div>
                                        <FieldError message={errors.phone} />
                                    </div>
                                    <div>
                                        <FieldLabel>Date of Birth</FieldLabel>
                                        <DatePicker
                                            value={values.date_of_birth ? dayjs(values.date_of_birth) : null}
                                            onChange={(date) => set('date_of_birth', date ? date.format('YYYY-MM-DD') : '')}
                                            format="DD MMM YYYY"
                                            className="h-9 w-full"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Gender</FieldLabel>
                                        <Select value={values.gender} onValueChange={val => set('gender', val)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="size-4 text-warning-foreground" />
                                    Address Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <FieldLabel>Street Address</FieldLabel>
                                    <Input
                                        placeholder="123 Business Way"
                                        value={values.address}
                                        onChange={e => set('address', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel>City</FieldLabel>
                                        <Input placeholder="New York" value={values.city} onChange={e => set('city', e.target.value)} />
                                    </div>
                                    <div>
                                        <FieldLabel>State / Region</FieldLabel>
                                        <Input placeholder="NY" value={values.state} onChange={e => set('state', e.target.value)} />
                                    </div>
                                    <div>
                                        <FieldLabel>Country</FieldLabel>
                                        <Input placeholder="United States" value={values.country} onChange={e => set('country', e.target.value)} />
                                    </div>
                                    <div>
                                        <FieldLabel>Postal Code</FieldLabel>
                                        <Input placeholder="10001" value={values.postal_code} onChange={e => set('postal_code', e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MessageSquare className="size-4 text-muted-foreground" />
                                    Additional Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Textarea
                                    placeholder="Internal remarks about customer preferences or history..."
                                    rows={4}
                                    value={values.notes}
                                    onChange={e => set('notes', e.target.value)}
                                    className="resize-none"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">

                        {/* Dark accent card — intentional design */}
                        <Card className="rounded-2xl shadow-sm border-0 bg-primary text-primary-foreground overflow-hidden relative">
                            <div className="absolute -top-6 -right-6 size-24 bg-white/5 rounded-full pointer-events-none" />
                            <CardContent className="pt-6 space-y-4">
                                <p className="font-semibold text-white text-sm tracking-wide">Profile Configuration</p>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5">
                                        Unique Code <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        placeholder="CUST-0001"
                                        value={values.customer_code}
                                        onChange={e => set('customer_code', e.target.value)}
                                        className={cn(
                                            'bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/40',
                                            errors.customer_code && 'border-destructive'
                                        )}
                                    />
                                    <FieldError message={errors.customer_code} />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <p className="text-sm font-medium text-white/70">Account Status</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                                            Active profiles earn loyalty points
                                        </p>
                                    </div>
                                    <Switch
                                        checked={values.is_active}
                                        onCheckedChange={val => set('is_active', val)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Star className="size-4 text-warning-foreground fill-warning-foreground" />
                                    Loyalty Program
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <FieldLabel>Membership Tier</FieldLabel>
                                    <Select value={values.loyalty_tier} onValueChange={val => set('loyalty_tier', val)}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="Silver">Silver</SelectItem>
                                            <SelectItem value="Gold">Gold</SelectItem>
                                            <SelectItem value="Platinum">Platinum</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>Initial Points</FieldLabel>
                                    <Input type="number" min={0} value={values.loyalty_points} onChange={e => set('loyalty_points', e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="size-4 text-primary" />
                                    Finance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div>
                                    <FieldLabel>Preferred Payment Method</FieldLabel>
                                    <Select value={values.preferred_payment_method} onValueChange={val => set('preferred_payment_method', val)}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Card">Credit / Debit Card</SelectItem>
                                            <SelectItem value="Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Mobile">Mobile Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={loading} className="h-11 w-full font-semibold">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Saving…
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="size-4" />
                                        Save Customer Profile
                                    </span>
                                )}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 w-full">
                                <X className="size-4" /> Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
