"use client"

import { useState } from "react";
import Link from "next/link";
import { Wallet, Loader2, Eye, EyeOff } from "lucide-react";
import AuthLeftPanel from "@/components/(shared-components)/AuthLeftPanel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { registrationHandler } from "@/(api-handlers)/registrationHandler";
import { registerSchema, RegisterFormData } from "@/utils/zod/registrationSchemas";
import { RegisterInterface } from "@/interfaces/registerInterface";
import { toast } from "sonner";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const [isLoading, setIsLoading]   = useState(false);
    const [showPwd, setShowPwd]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema) as Resolver<RegisterFormData>,
        defaultValues: {
            username: "", email: "", password: "", first_name: "",
            last_name: "", phone_number: "", invitation_code: "", confirm_password: "",
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        const payload: RegisterInterface = {
            username: data.username, email: data.email, password: data.password,
            first_name: data.first_name, last_name: data.last_name,
            phone_number: data.phone_number, invitation_code: data.invitation_code,
        };
        try {
            await registrationHandler(payload);
            reset();
            router.push(`/verify-email/pending?email=${encodeURIComponent(data.email)}`);
        } catch (error) {
            handleErrorMessage(error, "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">

            {/* ═══ LEFT PANEL ═══ */}
            <AuthLeftPanel
                narrow
                title={<>Join the<br />Paynest network.</>}
                description="Create your account and start managing your business like a pro."
            />

            {/* ═══ RIGHT PANEL ═══ */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 h-full overflow-y-auto">

                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                        <Wallet className="size-[18px] text-primary-foreground" />
                    </div>
                    <span className="text-[22px] font-extrabold text-foreground">Paynest</span>
                </div>

                <div className="w-full max-w-[580px]">

                    <div className="mb-8">
                        <h2 className="text-[28px] font-extrabold tracking-tight text-foreground">Create your account</h2>
                        <p className="mt-1.5 text-[14px] text-muted-foreground">Fill in the details below to get started</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

                        {/* Personal info */}
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                Personal information
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="first_name" className="text-sm font-medium">
                                        First Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="first_name" disabled={isLoading} placeholder="Your first name"
                                        className={cn("h-11", errors.first_name && "border-destructive")}
                                        {...register("first_name")} />
                                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="last_name" className="text-sm font-medium">
                                        Last Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="last_name" disabled={isLoading} placeholder="Your last name"
                                        className={cn("h-11", errors.last_name && "border-destructive")}
                                        {...register("last_name")} />
                                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email Address <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="email" type="email" disabled={isLoading} placeholder="your@email.com"
                                        className={cn("h-11", errors.email && "border-destructive")}
                                        {...register("email")} />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone_number" className="text-sm font-medium">
                                        Phone Number <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="phone_number" type="tel" disabled={isLoading} placeholder="Your phone number"
                                        className={cn("h-11", errors.phone_number && "border-destructive")}
                                        {...register("phone_number")} />
                                    {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Account details */}
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                Account details
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="username" className="text-sm font-medium">
                                        Username <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="username" disabled={isLoading} placeholder="Choose a username"
                                        className={cn("h-11", errors.username && "border-destructive")}
                                        {...register("username")} />
                                    {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="invitation_code" className="text-sm font-medium">
                                        Invitation Code <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="invitation_code" disabled={isLoading} placeholder="Enter your invitation code"
                                        className={cn("h-11", errors.invitation_code && "border-destructive")}
                                        {...register("invitation_code")} />
                                    {errors.invitation_code && <p className="text-xs text-destructive">{errors.invitation_code.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input id="password" type={showPwd ? "text" : "password"}
                                            disabled={isLoading} placeholder="Create a strong password"
                                            className={cn("h-11 pr-10", errors.password && "border-destructive")}
                                            {...register("password")} />
                                        <button type="button" tabIndex={-1}
                                            onClick={() => setShowPwd(p => !p)}
                                            aria-label={showPwd ? "Hide password" : "Show password"}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_password" className="text-sm font-medium">
                                        Confirm Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input id="confirm_password" type={showConfirm ? "text" : "password"}
                                            disabled={isLoading} placeholder="Confirm your password"
                                            className={cn("h-11 pr-10", errors.confirm_password && "border-destructive")}
                                            {...register("confirm_password")} />
                                        <button type="button" tabIndex={-1}
                                            onClick={() => setShowConfirm(p => !p)}
                                            aria-label={showConfirm ? "Hide password" : "Show password"}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox id="terms" disabled={isLoading} required className="mt-0.5" />
                            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer text-muted-foreground leading-snug">
                                I agree to the{" "}
                                <a href="#" className="font-semibold text-foreground hover:text-primary transition-colors">Terms of Service</a>
                                {" "}and{" "}
                                <a href="#" className="font-semibold text-foreground hover:text-primary transition-colors">Privacy Policy</a>
                            </Label>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold text-sm">
                            {isLoading
                                ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating Account…</>
                                : "Create Account"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
                            Login Now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
