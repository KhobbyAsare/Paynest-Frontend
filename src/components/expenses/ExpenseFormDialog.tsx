"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import {
    CreateExpense, GetExpenseCategories, UpdateExpense, UploadExpenseReceipt,
} from "@/(api-handlers)/expensesHandler";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE_BYTES } from "@/(api-handlers)/userHandler";
import { CreateExpenseRequest, ExpenseCategoryResponse, ExpenseResponse } from "@/interfaces/expenses";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const schema = z.object({
    category_id: z.string().min(1, "Category is required"),
    shop_id: z.string(),
    amount: z.string().min(1, "Amount is required"),
    expense_date: z.string().min(1, "Date is required"),
    vendor_name: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface ExpenseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: ExpenseResponse | null;
    onSuccess: () => void;
    shops: OrganizationShopResponse[];
}

const blankDefaults = (): FormValues => ({
    category_id: '', shop_id: 'org-wide', amount: '', expense_date: dayjs().format('YYYY-MM-DD'),
    vendor_name: '', description: '', notes: '',
});

export default function ExpenseFormDialog({
    open,
    onOpenChange,
    editing,
    onSuccess,
    shops,
}: Readonly<ExpenseFormDialogProps>) {
    const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: blankDefaults(),
    });

    useEffect(() => {
        if (!open) return;
        GetExpenseCategories().then(setCategories).catch(() => toast.error("Failed to load expense categories"));
        if (editing) {
            reset({
                category_id: String(editing.category_id),
                shop_id: editing.shop_id != null ? String(editing.shop_id) : 'org-wide',
                amount: String(editing.amount),
                expense_date: editing.expense_date,
                vendor_name: editing.vendor_name ?? '',
                description: editing.description ?? '',
                notes: editing.notes ?? '',
            });
            setReceiptUrl(editing.receipt_url);
        } else {
            reset(blankDefaults());
            setReceiptUrl(null);
        }
    }, [open, editing, reset]);

    const categoryLabel = (cat: ExpenseCategoryResponse) => {
        const scope = cat.shop_id != null
            ? (shops.find((s) => s.id === cat.shop_id)?.name || `Shop #${cat.shop_id}`)
            : 'Org-wide';
        return `${cat.name} — ${scope}`;
    };

    const uploadReceipt = async (file: File) => {
        const localUrl = URL.createObjectURL(file);
        setReceiptPreview(localUrl);
        setUploadingReceipt(true);
        try {
            const { receipt_url } = await UploadExpenseReceipt(file);
            setReceiptUrl(receipt_url);
            toast.success('Receipt uploaded');
        } catch (error) {
            handleErrorMessage(error, "Couldn't upload receipt photo");
        } finally {
            setUploadingReceipt(false);
            setReceiptPreview(null);
            URL.revokeObjectURL(localUrl);
        }
    };

    const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are supported');
            return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            toast.error('Image must be smaller than 5 MB');
            return;
        }
        uploadReceipt(file);
    };

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            const payload: CreateExpenseRequest = {
                category_id: Number(values.category_id),
                shop_id: values.shop_id === 'org-wide' ? null : Number(values.shop_id),
                amount: Number(values.amount),
                expense_date: values.expense_date,
                vendor_name: values.vendor_name || undefined,
                description: values.description || undefined,
                notes: values.notes || undefined,
                receipt_url: receiptUrl || undefined,
            };
            const res = editing
                ? await UpdateExpense(editing.id, payload)
                : await CreateExpense(payload);
            toast.success(`Expense ${res.expense_number} ${editing ? 'updated' : 'submitted'}`);
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            handleErrorMessage(error, "Failed to save expense");
        } finally {
            setSubmitting(false);
        }
    };

    const receiptSrc = receiptPreview || receiptUrl;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Expense" : "Submit Expense"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label>Category <span className="text-destructive">*</span></Label>
                        <Controller
                            control={control}
                            name="category_id"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>{categoryLabel(cat)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.category_id && <p className="text-destructive text-xs">{errors.category_id.message}</p>}
                        {categories.length === 0 && (
                            <p className="text-muted-foreground text-xs">
                                No categories yet — ask a manager to create one under Expense Categories settings.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Amount <span className="text-destructive">*</span></Label>
                            <Input type="number" step="0.01" min="0" {...register("amount")} placeholder="0.00" />
                            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date <span className="text-destructive">*</span></Label>
                            <Controller
                                control={control}
                                name="expense_date"
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
                    </div>

                    <div className="space-y-1.5">
                        <Label>Shop</Label>
                        <Controller
                            control={control}
                            name="shop_id"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="org-wide">Organization-wide</SelectItem>
                                        {shops.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Vendor</Label>
                        <Input {...register("vendor_name")} placeholder="e.g. ECG, landlord, supplier name" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea {...register("description")} placeholder="e.g. July electricity bill" rows={2} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Receipt Photo</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleReceiptFile}
                        />
                        <div className="flex items-center gap-3">
                            <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                {receiptSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={receiptSrc} alt="Receipt" className="size-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-muted-foreground size-6" />
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingReceipt}
                            >
                                {uploadingReceipt
                                    ? <Loader2 className="mr-2 size-4 animate-spin" />
                                    : <Camera className="mr-2 size-4" />
                                }
                                {receiptSrc ? 'Replace photo' : 'Attach photo'}
                            </Button>
                            {receiptUrl && !uploadingReceipt && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setReceiptUrl(null)}
                                    aria-label="Remove receipt photo"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Notes</Label>
                        <Textarea {...register("notes")} placeholder="Optional internal note" rows={2} />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || uploadingReceipt}>
                            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {editing ? "Update" : "Submit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
