"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { EmailReceipt } from "@/(api-handlers)/receiptsHandler";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

interface EmailReceiptDialogProps {
    orderId: number;
    defaultEmail?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EmailReceiptDialog({
    orderId,
    defaultEmail,
    open,
    onOpenChange,
}: Readonly<EmailReceiptDialogProps>) {
    const [submitting, setSubmitting] = useState(false);
    const {
        register, handleSubmit, reset, formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: defaultEmail ?? "" },
    });

    useEffect(() => {
        if (open) reset({ email: defaultEmail ?? "" });
    }, [open, defaultEmail, reset]);

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            const res = await EmailReceipt(orderId, { email: values.email });
            toast.success(`Receipt sent to ${res.sent_to}`);
            onOpenChange(false);
        } catch (error) {
            handleErrorMessage(error, "Failed to email receipt");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="size-5" />
                        Email Receipt
                    </DialogTitle>
                    <DialogDescription>
                        The receipt PDF will be sent as an attachment to this address.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label>Email address</Label>
                        <Input
                            type="email"
                            placeholder="customer@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-destructive text-xs">{errors.email.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Send
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
