"use client"

import { useState } from "react";
import Link from "next/link";
import { Wallet, Loader2, Eye, EyeOff } from "lucide-react";
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

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const chips = ["Barcode scanning", "Multi-location", "Live inventory", "Sales analytics", "Role-based access"];

export default function LoginPage() {
    const [isLoading, setIsLoading]       = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email_or_username: "", password: "", remember_me: false },
    });

    const emailOrUsernameValue = watch("email_or_username");

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        const fd = new FormData();
        fd.append("username", data.email_or_username);
        fd.append("password", data.password);
        try {
            const response = await loginWithFormData(fd);
            if (response) {
                setCookie("pos_token", response.access_token, { maxAge: 30 * 24 * 60 * 60, path: "/" });
                setCookie("user_role", response.user?.role || "attendant", { maxAge: 30 * 24 * 60 * 60, path: "/" });
                const { setAuth, updateUser } = useAuthStore.getState();
                setAuth(response);
                try { const u = await getUserData(); updateUser(u); } catch (e) { handleErrorMessage(e, "Failed to fetch user data."); }
                toast.success("Login successful!");
                const role = response.user?.role;
                if (role === "attendant") router.push("/sales");
                else if (role === "manager") router.push("/orders");
                else router.push("/dashboard");
            }
        } catch (error) {
            handleErrorMessage(error, "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">

            {/* ═══ LEFT PANEL ═══ */}
            <div className="hidden lg:flex lg:w-[580px] xl:w-[660px] flex-shrink-0 h-full relative overflow-hidden bg-primary text-primary-foreground">

                {/* Animations */}
                <style>{`
                    @keyframes pn-blob-a {
                        0%,100% { transform: translate(0,0) scale(1); }
                        50%      { transform: translate(50px,-65px) scale(1.15); }
                    }
                    @keyframes pn-blob-b {
                        0%,100% { transform: translate(0,0) scale(1); }
                        50%      { transform: translate(-40px,55px) scale(0.88); }
                    }
                    @keyframes pn-blob-c {
                        0%,100% { transform: translate(0,0) scale(1); }
                        33%      { transform: translate(35px,30px) scale(1.1); }
                        66%      { transform: translate(-25px,-35px) scale(0.93); }
                    }
                    @keyframes pn-sweep {
                        0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
                        8%   { opacity: 1; }
                        92%  { opacity: 1; }
                        100% { transform: translateX(320%) skewX(-18deg); opacity: 0; }
                    }
                    .pn-ba    { animation: pn-blob-a 14s ease-in-out infinite; }
                    .pn-bb    { animation: pn-blob-b 18s ease-in-out infinite; }
                    .pn-bc    { animation: pn-blob-c 22s ease-in-out infinite; }
                    .pn-sweep { animation: pn-sweep 7s ease-in-out infinite; animation-delay: 1.5s; }
                `}</style>

                {/* Blobs — higher opacity + less blur so they're actually visible */}
                <div className="pn-ba absolute top-[-60px] left-[-60px] size-[380px] rounded-full bg-white/25 blur-[55px]" />
                <div className="pn-bb absolute bottom-[-60px] right-[-40px] size-[420px] rounded-full bg-white/20 blur-[65px]" />
                <div className="pn-bc absolute top-[38%] left-[30%] size-[260px] rounded-full bg-white/[0.16] blur-[45px]" />

                {/* Light-sweep shimmer */}
                <div className="pn-sweep absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.055]"
                    style={{
                        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />

                {/* Content */}
                <div className="relative flex flex-col h-full w-full p-10 xl:p-14">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
                            <Wallet className="size-[18px]" />
                        </div>
                        <span className="text-[22px] font-extrabold tracking-tight">Paynest</span>
                    </div>

                    {/* Centre text */}
                    <div className="flex flex-1 flex-col justify-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                            Point of Sale Platform
                        </p>
                        <h1 className="text-[44px] xl:text-[52px] font-black leading-[1.06] tracking-tight">
                            Sell faster.<br />Grow bigger.
                        </h1>
                        <p className="mt-5 text-white/55 text-[15px] leading-relaxed max-w-[300px]">
                            The complete POS platform built for modern retail and hospitality businesses.
                        </p>

                        {/* Feature chips */}
                        <div className="mt-10 flex flex-wrap gap-2">
                            {chips.map(chip => (
                                <span
                                    key={chip}
                                    className="rounded-full border border-white/[0.16] bg-white/[0.09] px-3 py-1.5 text-[11px] font-medium text-white/65"
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>

                    <p className="text-[11px] text-white/30">© 2025 Paynest. All rights reserved.</p>
                </div>
            </div>

            {/* ═══ RIGHT PANEL ═══ */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-14 overflow-y-auto">

                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                        <Wallet className="size-[18px] text-primary-foreground" />
                    </div>
                    <span className="text-[22px] font-extrabold text-foreground">Paynest</span>
                </div>

                <div className="w-full max-w-[400px]">

                    <div className="mb-8">
                        <h2 className="text-[28px] font-extrabold tracking-tight text-foreground">Welcome back</h2>
                        <p className="mt-1.5 text-[14px] text-muted-foreground">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        <div className="space-y-1.5">
                            <Label htmlFor="email_or_username" className="text-sm font-medium">Email or Username</Label>
                            <Input
                                id="email_or_username"
                                type="text"
                                disabled={isLoading}
                                placeholder="Enter your email or username"
                                className={cn("h-11", errors.email_or_username && "border-destructive focus-visible:ring-destructive")}
                                {...register("email_or_username")}
                            />
                            {errors.email_or_username ? (
                                <p className="text-xs text-destructive">{errors.email_or_username.message}</p>
                            ) : emailOrUsernameValue ? (
                                <p className="text-xs text-muted-foreground">
                                    Logging in with {isEmail(emailOrUsernameValue) ? "email" : "username"}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                <Link href="/forget-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    disabled={isLoading}
                                    placeholder="Enter your password"
                                    className={cn("h-11 pr-10", errors.password && "border-destructive focus-visible:ring-destructive")}
                                    {...register("password")}
                                />
                                <button
                                    type="button" tabIndex={-1}
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox id="remember_me" disabled={isLoading} {...register("remember_me")} />
                            <Label htmlFor="remember_me" className="text-sm font-normal cursor-pointer text-muted-foreground">
                                Remember me for 30 days
                            </Label>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold text-sm">
                            {isLoading
                                ? <><Loader2 className="mr-2 size-4 animate-spin" />Signing in…</>
                                : "Sign in"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-foreground hover:text-primary transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
