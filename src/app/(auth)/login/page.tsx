"use client"

import SplitText from "@/components/(shared-components)/SplitText";
import { Wallet, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, LoginFormData } from "@/utils/zod/loginSchemas";
import { toast } from "sonner";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { loginWithFormData } from "@/(api-handlers)/loginHandler";
import { getUserData } from "@/(api-handlers)/userHandler";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { setCookie } from "cookies-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email_or_username: "", password: "", remember_me: false },
    });

    const emailOrUsernameValue = watch("email_or_username");

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('username', data.email_or_username);
        formData.append('password', data.password);
        try {
            const response = await loginWithFormData(formData);
            if (response) {
                setCookie('pos_token', response.access_token, { maxAge: 30 * 24 * 60 * 60, path: '/' });
                setCookie('user_role', response.user?.role || 'attendant', { maxAge: 30 * 24 * 60 * 60, path: '/' });
                const { setAuth, updateUser } = useAuthStore.getState();
                setAuth(response);
                try {
                    const userData = await getUserData();
                    updateUser(userData);
                } catch (userError) {
                    handleErrorMessage(userError, "Failed to fetch user data.");
                }
                toast.success("Login successful!");
                const role = response.user?.role;
                if (role === 'attendant') router.push("/sales");
                else if (role === 'manager') router.push("/orders");
                else router.push("/dashboard");
            }
        } catch (error) {
            handleErrorMessage(error, "Login failed. Please check your credentials.");
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
                    Sign in to your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-card px-6 py-12 shadow-sm border rounded-xl sm:px-12">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email_or_username">Email or Username</Label>
                            <Input
                                id="email_or_username"
                                type="text"
                                disabled={isLoading}
                                placeholder="Enter your email or username"
                                className={cn(errors.email_or_username && 'border-destructive')}
                                {...register("email_or_username")}
                            />
                            {errors.email_or_username && (
                                <p className="text-xs text-destructive">{errors.email_or_username.message}</p>
                            )}
                            {emailOrUsernameValue && !errors.email_or_username && (
                                <p className="text-xs text-muted-foreground">
                                    Logging in with {isEmail(emailOrUsernameValue) ? 'email' : 'username'}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                disabled={isLoading}
                                placeholder="Enter your password"
                                className={cn(errors.password && 'border-destructive')}
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox id="remember_me" disabled={isLoading} {...register("remember_me")} />
                                <Label htmlFor="remember_me" className="text-sm font-normal cursor-pointer">Remember me</Label>
                            </div>
                            <Link href="/forget-password" className="text-sm font-semibold text-primary hover:text-primary/80">
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Signing in…</> : "Sign in"}
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center gap-4">
                            <div className="flex-1 border-t" />
                            <p className="text-nowrap text-sm text-muted-foreground">Or continue with</p>
                            <div className="flex-1 border-t" />
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <Button type="button" variant="outline" disabled={isLoading} className="gap-2">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                                </svg>
                                Google
                            </Button>
                            <Button type="button" variant="outline" disabled={isLoading} className="gap-2">
                                <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" className="size-4">
                                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                </svg>
                                GitHub
                            </Button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-semibold text-primary hover:text-primary/80">Register Now</Link>
                </p>
            </div>
        </div>
    );
}
