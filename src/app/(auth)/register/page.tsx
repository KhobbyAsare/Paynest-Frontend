"use client"

import SplitText from "@/components/(shared-components)/SplitText";
import { Wallet, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "", email: "", password: "", first_name: "",
            last_name: "", phone_number: "", invitation_code: "", confirm_password: "",
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        const registrationData: RegisterInterface = {
            username: data.username,
            email: data.email,
            password: data.password,
            first_name: data.first_name,
            last_name: data.last_name,
            phone_number: data.phone_number,
            invitation_code: data.invitation_code,
        };
        try {
            const response = await registrationHandler(registrationData);
            if (response) {
                toast.success("Registration successful! You can now login.");
                reset();
                router.push("/login");
            }
        } catch (error) {
            handleErrorMessage(error, "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/30">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
                <div className="flex h-16 items-center gap-2">
                    <Wallet className="size-10 text-primary" />
                    <SplitText text="Paynest" className="text-3xl font-bold text-primary" />
                </div>
                <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
                    Create a new account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[800px]">
                <div className="bg-card px-6 py-12 shadow-sm border rounded-xl sm:px-12">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left column */}
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="first_name">First Name <span className="text-destructive">*</span></Label>
                                    <Input id="first_name" disabled={isLoading} placeholder="Your first name"
                                        className={cn(errors.first_name && 'border-destructive')} {...register("first_name")} />
                                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                                    <Input id="username" disabled={isLoading} placeholder="Choose a username"
                                        className={cn(errors.username && 'border-destructive')} {...register("username")} />
                                    {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                    <Input id="email" type="email" disabled={isLoading} placeholder="your@email.com"
                                        className={cn(errors.email && 'border-destructive')} {...register("email")} />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                                    <Input id="password" type="password" disabled={isLoading} placeholder="Create a strong password"
                                        className={cn(errors.password && 'border-destructive')} {...register("password")} />
                                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="last_name">Last Name <span className="text-destructive">*</span></Label>
                                    <Input id="last_name" disabled={isLoading} placeholder="Your last name"
                                        className={cn(errors.last_name && 'border-destructive')} {...register("last_name")} />
                                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone_number">Phone Number <span className="text-destructive">*</span></Label>
                                    <Input id="phone_number" type="tel" disabled={isLoading} placeholder="Your phone number"
                                        className={cn(errors.phone_number && 'border-destructive')} {...register("phone_number")} />
                                    {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="invitation_code">Invitation Code <span className="text-destructive">*</span></Label>
                                    <Input id="invitation_code" disabled={isLoading} placeholder="Enter your invitation code"
                                        className={cn(errors.invitation_code && 'border-destructive')} {...register("invitation_code")} />
                                    {errors.invitation_code && <p className="text-xs text-destructive">{errors.invitation_code.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_password">Confirm Password <span className="text-destructive">*</span></Label>
                                    <Input id="confirm_password" type="password" disabled={isLoading} placeholder="Confirm your password"
                                        className={cn(errors.confirm_password && 'border-destructive')} {...register("confirm_password")} />
                                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">Contact support if you don&apos;t have an invitation code.</p>

                        <div className="flex items-start gap-3">
                            <Checkbox id="terms" disabled={isLoading} required />
                            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                                I agree to the{" "}
                                <a href="#" className="font-semibold text-primary hover:text-primary/80">Terms of Service</a>
                                {" "}and{" "}
                                <a href="#" className="font-semibold text-primary hover:text-primary/80">Privacy Policy</a>
                            </Label>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating Account…</> : "Create Account"}
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center gap-4">
                            <div className="flex-1 border-t" />
                            <p className="text-nowrap text-sm text-muted-foreground">Or continue with</p>
                            <div className="flex-1 border-t" />
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <Button type="button" variant="outline" className="gap-2">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                                </svg>
                                Google
                            </Button>
                            <Button type="button" variant="outline" className="gap-2">
                                <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" className="size-4">
                                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                </svg>
                                GitHub
                            </Button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:text-primary/80">Login Now</Link>
                </p>
            </div>
        </div>
    );
}
