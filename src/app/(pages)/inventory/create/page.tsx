"use client"

import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft, Package, Store, Ruler, TrendingUp,
    MapPin, CheckCircle2, Loader2, AlertTriangle,
    BarChart3, RotateCcw, ShieldCheck,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

function SectionHeader({ icon: Icon, label, description, iconCls }: {
    icon: React.ElementType;
    label: string;
    description: string;
    iconCls: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', iconCls)}>
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-foreground text-sm font-semibold">{label}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
            </div>
        </div>
    );
}

function FieldErr({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
            <AlertTriangle className="size-3" /> {message}
        </p>
    );
}

export default function CreateInventoryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [submitting, setSubmitting] = useState(false);
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [values, setValues] = useState<FormValues>(defaultValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const { user } = useAuthStore();

    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';
    const userShopId = user?.employee_profile?.shop_id;

    const selectedProduct = useMemo(
        () => products.find(p => String(p.id) === values.product_id) ?? null,
        [products, values.product_id],
    );
    const selectedShop = useMemo(
        () => shops.find(s => String(s.id) === values.shop_id) ?? null,
        [shops, values.shop_id],
    );

    const currentStock = Number(values.current_stock) || 0;
    const maxStock = Number(values.maximum_stock) || 100;
    const stockPct = Math.min((currentStock / maxStock) * 100, 100);

    useEffect(() => {
        (async () => {
            try {
                const [shopsData, productsData] = await Promise.all([
                    getOrganizationShops(),
                    GetProducts(),
                ]);
                setShops(shopsData);
                setProducts(productsData);
                const pid = searchParams.get('product_id');
                if (pid) setValues(prev => ({ ...prev, product_id: pid }));
            } catch {
                toast.error('Failed to load data');
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isAdmin && userShopId) {
            setValues(prev => ({ ...prev, shop_id: String(userShopId) }));
        } else if (shops.length === 1 && !values.shop_id) {
            setValues(prev => ({ ...prev, shop_id: String(shops[0].id) }));
        }
    }, [isAdmin, userShopId, shops, values.shop_id]);

    function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
        setValues(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }

    function validate(): boolean {
        const e: FormErrors = {};
        if (!values.product_id) e.product_id = 'Select a product';
        if (!values.shop_id) e.shop_id = 'Select a shop';
        if (values.current_stock === '') e.current_stock = 'Required';
        if (values.minimum_stock === '') e.minimum_stock = 'Required';
        if (values.maximum_stock === '') e.maximum_stock = 'Required';
        if (values.reorder_point === '') e.reorder_point = 'Required';
        if (values.reorder_quantity === '') e.reorder_quantity = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
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
            toast.success('Inventory record created');
            router.push('/inventory');
        } catch (err) {
            handleErrorMessage(err, 'Failed to create inventory record');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">

            {/* ── Page header ── */}
            <div className="flex items-start gap-4">
                <Button variant="outline" size="icon" className="mt-0.5 shrink-0" onClick={() => router.back()}>
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <nav className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href="/inventory" className="hover:text-foreground transition-colors">Inventory</Link>
                        <span>/</span>
                        <span className="text-foreground">New record</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Stock a Product</h1>
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full text-[10px] font-semibold">
                            New record
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Set up stock tracking, thresholds, and storage location for a product.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* ── Left column (main form) ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Product & shop */}
                        <div className="bg-card rounded-2xl border p-6 space-y-5">
                            <SectionHeader
                                icon={Package}
                                label="Product & Shop"
                                description="Link this inventory record to a product and store."
                                iconCls="bg-primary/10 text-primary"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Product <span className="text-destructive">*</span></Label>
                                    <Select value={values.product_id} onValueChange={v => set('product_id', v)}>
                                        <SelectTrigger className={cn('h-10', errors.product_id && 'border-destructive')}>
                                            <SelectValue placeholder="Choose a product…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldErr message={errors.product_id} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Shop <span className="text-destructive">*</span></Label>
                                    <Select value={values.shop_id} onValueChange={v => set('shop_id', v)} disabled={!isAdmin}>
                                        <SelectTrigger className={cn('h-10', errors.shop_id && 'border-destructive')}>
                                            <SelectValue placeholder="Choose a shop…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shops.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldErr message={errors.shop_id} />
                                </div>
                            </div>
                        </div>

                        {/* Stock levels */}
                        <div className="bg-card rounded-2xl border p-6 space-y-5">
                            <SectionHeader
                                icon={BarChart3}
                                label="Stock Levels"
                                description="Define opening stock and automated reorder thresholds."
                                iconCls="bg-success/10 text-success"
                            />

                            {/* Opening stock + visual bar */}
                            <div className="space-y-2">
                                <Label>Opening stock <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number" min="0"
                                    className={cn('h-10', errors.current_stock && 'border-destructive')}
                                    placeholder="0"
                                    value={values.current_stock}
                                    onChange={e => set('current_stock', e.target.value)}
                                />
                                <FieldErr message={errors.current_stock} />
                                {/* Mini stock bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>0</span>
                                        <span className={cn(
                                            'font-semibold',
                                            stockPct === 0 ? 'text-destructive'
                                                : stockPct < 20 ? 'text-warning-foreground'
                                                    : 'text-success'
                                        )}>
                                            {currentStock} / {maxStock} {values.unit_of_measurement}
                                        </span>
                                        <span>Max {maxStock}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-500',
                                                stockPct === 0 ? 'bg-destructive w-0'
                                                    : stockPct < 20 ? 'bg-warning'
                                                        : 'bg-success',
                                            )}
                                            style={{ width: `${stockPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {([
                                    { key: 'minimum_stock', label: 'Min. stock', hint: 'Alert threshold' },
                                    { key: 'maximum_stock', label: 'Max. stock', hint: 'Capacity limit' },
                                    { key: 'reorder_point', label: 'Reorder point', hint: 'Auto-flag level' },
                                    { key: 'reorder_quantity', label: 'Reorder qty', hint: 'Amount to order' },
                                ] as { key: keyof FormErrors & keyof FormValues; label: string; hint: string }[]).map(({ key, label, hint }) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label>
                                            {label} <span className="text-destructive">*</span>
                                            <span className="text-muted-foreground font-normal ml-1 text-[10px]">— {hint}</span>
                                        </Label>
                                        <Input
                                            type="number" min="0"
                                            className={cn('h-10', errors[key] && 'border-destructive')}
                                            value={values[key] as string}
                                            onChange={e => set(key, e.target.value)}
                                        />
                                        <FieldErr message={errors[key]} />
                                    </div>
                                ))}
                            </div>

                            {/* Reorder callout */}
                            <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 px-4 py-3">
                                <RotateCcw className="mt-0.5 size-4 shrink-0 text-info" />
                                <p className="text-xs text-info">
                                    Automatic reorder alert fires when stock drops to{' '}
                                    <strong>{values.reorder_point || '—'}</strong>{' '}
                                    {values.unit_of_measurement}. System will suggest ordering{' '}
                                    <strong>{values.reorder_quantity || '—'}</strong> more.
                                </p>
                            </div>
                        </div>

                        {/* Unit & availability */}
                        <div className="bg-card rounded-2xl border p-6 space-y-5">
                            <SectionHeader
                                icon={Ruler}
                                label="Unit & Availability"
                                description="How the stock is measured and whether it's listed for sale."
                                iconCls="bg-warning/10 text-warning-foreground"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Unit of measurement</Label>
                                    <Select value={values.unit_of_measurement} onValueChange={v => set('unit_of_measurement', v)}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="units">Units / Pieces</SelectItem>
                                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                            <SelectItem value="liters">Liters (L)</SelectItem>
                                            <SelectItem value="packs">Packs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className={cn(
                                    'flex items-center justify-between rounded-xl border p-4 transition-colors',
                                    values.on_sale ? 'border-success/30 bg-success/5' : 'bg-muted/40',
                                )}>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Available for sale</p>
                                        <p className="text-xs text-muted-foreground">Show in POS checkout</p>
                                    </div>
                                    <Switch checked={values.on_sale} onCheckedChange={v => set('on_sale', v)} />
                                </div>
                                <div className={cn(
                                    'flex items-center justify-between rounded-xl border p-4 transition-colors',
                                    values.is_active ? 'border-primary/30 bg-primary/5' : 'bg-muted/40',
                                )}>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Active tracking</p>
                                        <p className="text-xs text-muted-foreground">Include in inventory</p>
                                    </div>
                                    <Switch checked={values.is_active} onCheckedChange={v => set('is_active', v)} />
                                </div>
                            </div>
                        </div>

                        {/* Storage location */}
                        <div className="bg-card rounded-2xl border p-6 space-y-5">
                            <SectionHeader
                                icon={MapPin}
                                label="Storage Location"
                                description="Where this product is physically stored in your warehouse."
                                iconCls="bg-info/10 text-info"
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Aisle</Label>
                                    <Input className="h-10 font-mono" placeholder="e.g. A4" value={values.aisle} onChange={e => set('aisle', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Shelf</Label>
                                    <Input className="h-10 font-mono" placeholder="e.g. B2" value={values.shelf} onChange={e => set('shelf', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Bin</Label>
                                    <Input className="h-10 font-mono" placeholder="e.g. BIN-09" value={values.bin_location} onChange={e => set('bin_location', e.target.value)} />
                                </div>
                            </div>
                            {(values.aisle || values.shelf || values.bin_location) && (
                                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5">
                                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-muted-foreground">
                                        Location:{' '}
                                        <span className="text-foreground font-mono font-semibold">
                                            {[values.aisle, values.shelf, values.bin_location].filter(Boolean).join(' · ')}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right sidebar ── */}
                    <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

                        {/* Live summary card */}
                        <div className="bg-card rounded-2xl border overflow-hidden">
                            <div className="bg-gradient-to-br from-primary/[0.07] to-transparent px-5 py-4 border-b border-border/60">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Record summary</p>
                            </div>
                            <div className="px-5 py-4 space-y-3">
                                <SummaryRow icon={Package} label="Product" value={selectedProduct?.name ?? <span className="text-muted-foreground italic">Not selected</span>} />
                                <SummaryRow icon={Store} label="Shop" value={selectedShop?.name ?? <span className="text-muted-foreground italic">Not selected</span>} />
                                <SummaryRow icon={TrendingUp} label="Opening stock"
                                    value={
                                        <span className={cn(
                                            'font-bold',
                                            currentStock === 0 ? 'text-destructive'
                                                : currentStock <= Number(values.minimum_stock) ? 'text-warning-foreground'
                                                    : 'text-success'
                                        )}>
                                            {currentStock} {values.unit_of_measurement}
                                        </span>
                                    }
                                />
                                <SummaryRow icon={RotateCcw} label="Reorder at" value={`${values.reorder_point || '—'} ${values.unit_of_measurement}`} />
                                {(values.aisle || values.shelf || values.bin_location) && (
                                    <SummaryRow icon={MapPin} label="Location"
                                        value={<span className="font-mono">{[values.aisle, values.shelf, values.bin_location].filter(Boolean).join(' · ')}</span>}
                                    />
                                )}
                            </div>

                            {/* Status badges */}
                            <div className="border-t border-border/60 px-5 py-3 flex gap-2 flex-wrap">
                                <Badge variant="outline" className={cn(
                                    'rounded-full text-[10px] font-semibold',
                                    values.is_active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                                )}>
                                    {values.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline" className={cn(
                                    'rounded-full text-[10px] font-semibold',
                                    values.on_sale ? 'border-success/30 bg-success/10 text-success' : 'border-border text-muted-foreground',
                                )}>
                                    {values.on_sale ? 'On sale' : 'Not for sale'}
                                </Badge>
                            </div>
                        </div>

                        {/* Tips card */}
                        <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">Tips</p>
                            </div>
                            {[
                                'Set reorder point above minimum stock so you have time to reorder.',
                                'Use bin location codes for fast warehouse picking.',
                                'Toggle "Available for sale" off to hide from POS without deleting.',
                            ].map(tip => (
                                <div key={tip} className="flex items-start gap-2">
                                    <CheckCircle2 className="size-3 text-success mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                            <Button type="submit" className="h-11 w-full text-sm" disabled={submitting}>
                                {submitting
                                    ? <><Loader2 className="size-4 animate-spin" /> Creating record…</>
                                    : <><CheckCircle2 className="size-4" /> Create inventory record</>
                                }
                            </Button>
                            <Button type="button" variant="outline" className="h-10 w-full text-sm" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

function SummaryRow({ icon: Icon, label, value }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
            </div>
        </div>
    );
}
