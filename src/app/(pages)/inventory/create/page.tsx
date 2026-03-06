"use client"

import { useEffect, useState } from 'react';
import {
    Save, X, Package, Navigation,
    ArrowLeft, AlertCircle, TrendingUp, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CreateInventory } from '@/(api-handlers)/inventoryHandler';
import { getOrganizationShops } from '@/(api-handlers)/organizationShopsHandler';
import { GetProducts } from '@/(api-handlers)/productsHandler';
import { OrganizationShopResponse } from '@/interfaces/organizationShops';
import { ProductResponse } from '@/interfaces/products';
import { CreateInventoryRequest } from '@/interfaces/inventory';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import { useAuthStore } from '@/(zustand-store)/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormValues {
    product_id: string;
    shop_id: string;
    unit_of_measurement: string;
    on_sale: boolean;
    is_active: boolean;
    current_stock: string;
    minimum_stock: string;
    maximum_stock: string;
    reorder_point: string;
    reorder_quantity: string;
    aisle: string;
    shelf: string;
    bin_location: string;
}

interface FormErrors {
    product_id?: string;
    shop_id?: string;
    unit_of_measurement?: string;
    current_stock?: string;
    minimum_stock?: string;
    maximum_stock?: string;
    reorder_point?: string;
    reorder_quantity?: string;
}

const defaultValues: FormValues = {
    product_id: '',
    shop_id: '',
    unit_of_measurement: 'units',
    on_sale: false,
    is_active: true,
    current_stock: '0',
    minimum_stock: '5',
    maximum_stock: '100',
    reorder_point: '10',
    reorder_quantity: '20',
    aisle: '',
    shelf: '',
    bin_location: '',
};

function FieldLabel({ children, required }: Readonly<{ children: React.ReactNode; required?: boolean }>) {
    return (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {children}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}

function FieldError({ message }: Readonly<{ message?: string }>) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-rose-500">{message}</p>;
}

export default function CreateInventoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [values, setValues] = useState<FormValues>(defaultValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const { user } = useAuthStore();

    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';
    const userShopId = user?.employee_profile?.shop_id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shopsData, productsData] = await Promise.all([
                    getOrganizationShops(),
                    GetProducts()
                ]);
                setShops(shopsData);
                setProducts(productsData);
            } catch (error) {
                console.error("Failed to fetch requirements", error);
                toast.error("Failed to load dependency data");
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        // Auto-select for non-admins if they have a shop ID
        if (!isAdmin && userShopId) {
            setValues(prev => ({ ...prev, shop_id: String(userShopId) }));
        }
        // Or if only one shop exists, select it automatically for anyone
        else if (shops.length === 1 && !values.shop_id) {
            setValues(prev => ({ ...prev, shop_id: String(shops[0].id) }));
        }
    }, [isAdmin, userShopId, shops, values.shop_id]);

    function handleFieldChange<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues(prev => ({ ...prev, [key]: value }));
        // Clear error on change
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }

    function validate(): boolean {
        const newErrors: FormErrors = {};
        if (!values.product_id) newErrors.product_id = 'Please select a product';
        if (!values.shop_id) newErrors.shop_id = 'Please select a shop';
        if (!values.unit_of_measurement) newErrors.unit_of_measurement = 'Please select a unit';
        if (values.current_stock === '') newErrors.current_stock = 'Opening stock is required';
        if (values.minimum_stock === '') newErrors.minimum_stock = 'Min stock is required';
        if (values.maximum_stock === '') newErrors.maximum_stock = 'Max stock is required';
        if (values.reorder_point === '') newErrors.reorder_point = 'Reorder point is required';
        if (values.reorder_quantity === '') newErrors.reorder_quantity = 'Reorder quantity is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload: CreateInventoryRequest = {
                product_id: Number(values.product_id),
                current_stock: Number(values.current_stock),
                minimum_stock: Number(values.minimum_stock),
                maximum_stock: Number(values.maximum_stock),
                reorder_point: Number(values.reorder_point),
                reorder_quantity: Number(values.reorder_quantity),
                unit_of_measurement: values.unit_of_measurement,
                aisle: values.aisle,
                shelf: values.shelf,
                bin_location: values.bin_location,
                on_sale: values.on_sale,
                is_active: values.is_active,
            };
            await CreateInventory(payload);
            toast.success('Inventory record created successfully');
            router.push('/inventory');
        } catch (error: unknown) {
            handleErrorMessage(error, 'Failed to create inventory record');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <Link href="/inventory" className="hover:text-slate-600 transition-colors">Inventory</Link>
                    <span>/</span>
                    <span className="text-slate-600">Create New Record</span>
                </nav>

                {/* Page heading */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl border-slate-200 shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Inventory Record</h1>
                        <p className="text-slate-500 text-sm">Initialize a new stock tracking entry for a product.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Product Association */}
                        <Card className="md:col-span-2 rounded-2xl border-slate-100 shadow-sm">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="size-4 text-primary" />
                                    Product Association
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Product Selection */}
                                    <div>
                                        <FieldLabel required>Select Product</FieldLabel>
                                        <Select
                                            value={values.product_id}
                                            onValueChange={val => handleFieldChange('product_id', val)}
                                        >
                                            <SelectTrigger className={cn("w-full", errors.product_id && 'border-rose-400')}>
                                                <SelectValue placeholder="Search product..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(product => (
                                                    <SelectItem key={product.id} value={String(product.id)}>
                                                        {product.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError message={errors.product_id} />
                                    </div>

                                    {/* Shop */}
                                    <div>
                                        <FieldLabel required>Assigned Shop</FieldLabel>
                                        <Select
                                            value={values.shop_id}
                                            onValueChange={val => handleFieldChange('shop_id', val)}
                                            disabled={!isAdmin}
                                        >
                                            <SelectTrigger className={cn("w-full", errors.shop_id && 'border-rose-400')}>
                                                <SelectValue placeholder="Select Shop" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shops.map(shop => (
                                                    <SelectItem key={shop.id} value={String(shop.id)}>
                                                        {shop.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError message={errors.shop_id} />
                                    </div>

                                    {/* Unit of Measurement */}
                                    <div>
                                        <FieldLabel required>Unit of Measurement</FieldLabel>
                                        <Select
                                            value={values.unit_of_measurement}
                                            onValueChange={val => handleFieldChange('unit_of_measurement', val)}
                                        >
                                            <SelectTrigger className={cn("w-full", errors.unit_of_measurement && 'border-rose-400')}>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="units">Units / Pieces</SelectItem>
                                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                                <SelectItem value="liters">Liters (L)</SelectItem>
                                                <SelectItem value="packs">Packs</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FieldError message={errors.unit_of_measurement} />
                                    </div>

                                    {/* On Sale */}
                                    <div>
                                        <FieldLabel>Available for Sale</FieldLabel>
                                        <div className="flex items-center gap-3 h-9">
                                            <Switch
                                                checked={values.on_sale}
                                                onCheckedChange={val => handleFieldChange('on_sale', val)}
                                            />
                                            <span className="text-sm text-slate-500">
                                                {values.on_sale ? 'Listed for sale' : 'Not for sale'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Sidebar */}
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-slate-100 shadow-sm bg-slate-50/50">
                                <CardContent className="pt-6">
                                    <FieldLabel>Status</FieldLabel>
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-sm font-medium text-slate-600">Active Tracking</span>
                                        <Switch
                                            checked={values.is_active}
                                            onCheckedChange={val => handleFieldChange('is_active', val)}
                                        />
                                    </div>
                                    <hr className="my-4 border-slate-200" />
                                    <div className="flex items-start gap-2 text-xs text-slate-500">
                                        <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
                                        <p>Inactive records will be hidden from the main inventory dashboard but preserved for logs.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Stock Configuration */}
                        <Card className="md:col-span-3 rounded-2xl border-slate-100 shadow-sm">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="size-4 text-emerald-500" />
                                    Stock Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {(
                                        [
                                            { key: 'current_stock', label: 'Opening Stock' },
                                            { key: 'minimum_stock', label: 'Min. Stock' },
                                            { key: 'maximum_stock', label: 'Max. Stock' },
                                            { key: 'reorder_point', label: 'Reorder Point' },
                                            { key: 'reorder_quantity', label: 'Reorder Qty' },
                                        ] as { key: keyof FormErrors & keyof FormValues; label: string }[]
                                    ).map(({ key, label }) => (
                                        <div key={key}>
                                            <FieldLabel required>{label}</FieldLabel>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={values[key] as string}
                                                onChange={e => handleFieldChange(key, e.target.value)}
                                                className={cn(errors[key] && 'border-rose-400 focus-visible:border-rose-400')}
                                            />
                                            <FieldError message={errors[key]} />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                    <AlertCircle className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-emerald-800">
                                        <p className="font-semibold">Smart Tracking Enabled</p>
                                        <p className="opacity-80">
                                            System will automatically mark items for reorder when stock falls below{' '}
                                            <strong>{values.reorder_point || 10}</strong> units.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Storage Location */}
                        <Card className="md:col-span-3 rounded-2xl border-slate-100 shadow-sm">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Navigation className="size-4 text-amber-500" />
                                    Storage Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <FieldLabel>Aisle</FieldLabel>
                                        <Input
                                            placeholder="e.g. Aisle 4"
                                            value={values.aisle}
                                            onChange={e => handleFieldChange('aisle', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Shelf</FieldLabel>
                                        <Input
                                            placeholder="e.g. Shelf B2"
                                            value={values.shelf}
                                            onChange={e => handleFieldChange('shelf', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Bin Location</FieldLabel>
                                        <Input
                                            placeholder="e.g. BIN-092"
                                            value={values.bin_location}
                                            onChange={e => handleFieldChange('bin_location', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="h-11 px-6 rounded-xl"
                        >
                            <X className="size-4" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-11 px-8 rounded-xl shadow-lg shadow-blue-100"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Saving…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="size-4" />
                                    Create Inventory Record
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
