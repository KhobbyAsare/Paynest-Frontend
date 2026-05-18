"use client"

import { useState } from "react";
import Link from "next/link";
import { Wallet, ArrowLeft, Mail, Loader2 } from "lucide-react";
import AuthLeftPanel from "@/components/(shared-components)/AuthLeftPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordHandler } from "@/(api-handlers)/loginHandler";
import { handleErrorMessage } from "@/utils/handleErrorMessage";

export default function ForgetPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        try {
            await forgotPasswordHandler(email);
            setSubmitted(true);
        } catch (error) {
            handleErrorMessage(error, "Failed to send reset link. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">

            {/* ═══ LEFT PANEL ═══ */}
            <AuthLeftPanel
                title={<>Forgot your<br />password?</>}
                description="No worries. Enter your email and we'll send you a secure link to get back in."
            />

            {/* ═══ RIGHT PANEL ═══ */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-14 h-full overflow-y-auto">

                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                        <Wallet className="size-[18px] text-primary-foreground" />
                    </div>
                    <span className="text-[22px] font-extrabold text-foreground">Paynest</span>
                </div>

                <div className="w-full max-w-[400px]">

                    {!submitted ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-[28px] font-extrabold tracking-tight text-foreground">Reset your password</h2>
                                <p className="mt-1.5 text-[14px] text-muted-foreground">
                                    Enter your email and we&apos;ll send you a reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="your@email.com"
                                        className="h-11"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold text-sm">
                                    {isLoading
                                        ? <><Loader2 className="mr-2 size-4 animate-spin" />Sending…</>
                                        : "Send reset link"}
                                </Button>
                            </form>
                        </>
                    ) : (
                        /* Success state */
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                                <Mail className="size-7 text-primary" />
                            </div>
                            <h2 className="text-[28px] font-extrabold tracking-tight text-foreground">Check your inbox</h2>
                            <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
                                We sent a password reset link to{" "}
                                <span className="font-semibold text-foreground">{email}</span>.
                                Check your inbox and follow the instructions.
                            </p>
                            <p className="mt-4 text-xs text-muted-foreground">
                                Didn&apos;t receive it?{" "}
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    Try again
                                </button>
                            </p>
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-center">
                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-3.5" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
