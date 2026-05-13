"use client"

import { useState } from "react";
import Link from "next/link";
import { Wallet, ArrowLeft, Mail, Loader2 } from "lucide-react";
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
            <div className="hidden lg:flex lg:w-[580px] xl:w-[660px] flex-shrink-0 h-full relative overflow-hidden bg-[var(--brand-800)] text-white">

                {/* Animations */}
                <style>{`
                    @keyframes pn-fp-blob-a {
                        0%,100% { transform: translate(0,0) scale(1); }
                        50%      { transform: translate(45px,-55px) scale(1.13); }
                    }
                    @keyframes pn-fp-blob-b {
                        0%,100% { transform: translate(0,0) scale(1); }
                        50%      { transform: translate(-38px,50px) scale(0.89); }
                    }
                    @keyframes pn-fp-blob-c {
                        0%,100% { transform: translate(0,0) scale(1); }
                        33%      { transform: translate(30px,28px) scale(1.09); }
                        66%      { transform: translate(-22px,-30px) scale(0.94); }
                    }
                    @keyframes pn-fp-sweep {
                        0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
                        8%   { opacity: 1; }
                        92%  { opacity: 1; }
                        100% { transform: translateX(320%) skewX(-18deg); opacity: 0; }
                    }
                    .pn-fp-ba    { animation: pn-fp-blob-a 15s ease-in-out infinite; }
                    .pn-fp-bb    { animation: pn-fp-blob-b 19s ease-in-out infinite; }
                    .pn-fp-bc    { animation: pn-fp-blob-c 23s ease-in-out infinite; }
                    .pn-fp-sweep { animation: pn-fp-sweep 7s ease-in-out infinite; animation-delay: 2s; }
                `}</style>

                {/* Blobs */}
                <div className="pn-fp-ba absolute top-[-60px] left-[-60px] size-[380px] rounded-full bg-white/25 blur-[55px]" />
                <div className="pn-fp-bb absolute bottom-[-60px] right-[-40px] size-[420px] rounded-full bg-white/20 blur-[65px]" />
                <div className="pn-fp-bc absolute top-[38%] left-[30%] size-[260px] rounded-full bg-white/[0.15] blur-[45px]" />

                {/* Sweep shimmer */}
                <div className="pn-fp-sweep absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

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
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
                            <Wallet className="size-[18px]" />
                        </div>
                        <span className="text-[22px] font-extrabold tracking-tight">Paynest</span>
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                            Account Recovery
                        </p>
                        <h1 className="text-[44px] xl:text-[52px] font-black leading-[1.06] tracking-tight">
                            Forgot your<br />password?
                        </h1>
                        <p className="mt-5 text-white/55 text-[15px] leading-relaxed max-w-[300px]">
                            No worries. Enter your email and we&apos;ll send you a secure link to get back in.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-2">
                            {["Secure reset link", "Email verification", "Quick recovery"].map(chip => (
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
