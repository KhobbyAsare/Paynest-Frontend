"use client"

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import AuthLeftPanel from "@/components/(shared-components)/AuthLeftPanel";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordHandler } from "@/(api-handlers)/loginHandler";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { cn } from "@/lib/utils";

const schema = z
    .object({
        new_password: z.string().min(8, "Password must be at least 8 characters"),
        confirm_password: z.string(),
    })
    .refine((d) => d.new_password === d.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
    });

    if (!token) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
                <div className="w-full max-w-[400px] text-center">
                    <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
                        <XCircle className="size-7 text-destructive" />
                    </div>
                    <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">Invalid link</h1>
                    <p className="mt-2 text-sm text-muted-foreground">This reset link is missing a token. Please request a new one.</p>
                    <Button asChild className="mt-8 w-full h-12 rounded-full font-semibold text-sm">
                        <Link href="/forget-password">Request new link</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            await resetPasswordHandler(token, data.new_password);
            setDone(true);
        } catch (err: any) {
            const detail = err?.response?.data?.detail ?? "Failed to reset password. The link may have expired.";
            setError(detail);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">

            {/* ═══ LEFT PANEL ═══ */}
            <AuthLeftPanel
                title={<>Set a new<br />password.</>}
                description="Choose a strong password to secure your Paynest account."
            />

            {/* ═══ RIGHT PANEL ═══ */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-14 overflow-y-auto">

                <div className="lg:hidden mb-10 flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                        <Wallet className="size-[18px] text-primary-foreground" />
                    </div>
                    <span className="text-[22px] font-extrabold text-foreground">Paynest</span>
                </div>

                <div className="w-full max-w-[400px]">

                    {done ? (
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success/10 border border-success/20">
                                <CheckCircle2 className="size-7 text-success" />
                            </div>
                            <h2 className="text-[26px] font-extrabold tracking-tight text-foreground">Password updated!</h2>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                Your password has been reset successfully. All previous sessions have been revoked.
                            </p>
                            <Button className="mt-8 w-full h-12 rounded-full font-semibold text-sm" onClick={() => router.push("/login")}>
                                Continue to sign in
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                <h2 className="text-[28px] font-extrabold tracking-tight text-foreground">Set new password</h2>
                                <p className="mt-1.5 text-[14px] text-muted-foreground">Must be at least 8 characters.</p>
                            </div>

                            {error && (
                                <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                                    <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new_password" className="text-sm font-medium">
                                        New Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password"
                                            type={showPwd ? "text" : "password"}
                                            disabled={isSubmitting}
                                            placeholder="Create a strong password"
                                            className={cn("h-12 rounded-full px-5 pr-11", errors.new_password && "border-destructive")}
                                            {...register("new_password")}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowPwd(p => !p)}
                                            aria-label={showPwd ? "Hide password" : "Show password"}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_password" className="text-sm font-medium">
                                        Confirm Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_password"
                                            type={showConfirm ? "text" : "password"}
                                            disabled={isSubmitting}
                                            placeholder="Confirm your new password"
                                            className={cn("h-12 rounded-full px-5 pr-11", errors.confirm_password && "border-destructive")}
                                            {...register("confirm_password")}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                                            aria-label={showConfirm ? "Hide password" : "Show password"}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                                </div>

                                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-full font-semibold text-sm">
                                    {isSubmitting
                                        ? <><Loader2 className="mr-2 size-4 animate-spin" />Resetting…</>
                                        : "Reset password"}
                                </Button>
                            </form>

                            <div className="mt-8 flex items-center justify-center">
                                <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Back to login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
