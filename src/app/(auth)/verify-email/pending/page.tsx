"use client"

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Wallet, Mail, Loader2, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { resendVerificationHandler } from "@/(api-handlers)/registrationHandler";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { Button } from "@/components/ui/button";
import { useCooldown, formatCooldown } from "@/hooks/useCooldown";

const RESEND_COOLDOWN_SECONDS = 120;

export default function VerifyEmailPendingPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") ?? "";
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useCooldown();

    const handleResend = async () => {
        if (!email || cooldown > 0) return;
        setIsSending(true);
        try {
            await resendVerificationHandler(email);
            setSent(true);
            setCooldown(RESEND_COOLDOWN_SECONDS);
            toast.success("Verification email resent. Check your inbox.");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setCooldown(RESEND_COOLDOWN_SECONDS);
            }
            handleErrorMessage(error, "Failed to resend. Please try again shortly.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">

            {/* Logo */}
            <div className="mb-10 flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                    <Wallet className="size-[18px] text-primary-foreground" />
                </div>
                <span className="text-[22px] font-extrabold text-foreground">Paynest</span>
            </div>

            <div className="w-full max-w-[420px] text-center">

                {/* Icon */}
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                    <Mail className="size-7 text-primary" />
                </div>

                <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
                    Check your email
                </h1>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
                    We&apos;ve sent a verification link to{" "}
                    {email ? (
                        <span className="font-semibold text-foreground">{email}</span>
                    ) : (
                        "your email address"
                    )}
                    . Click it to activate your account.
                </p>

                <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5 text-left space-y-2">
                    <p className="text-[13px] font-semibold text-foreground">Didn&apos;t receive it?</p>
                    <ul className="text-[13px] text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Check your spam or junk folder</li>
                        <li>Make sure the email address is correct</li>
                        <li>The link expires in 24 hours</li>
                    </ul>
                </div>

                <Button
                    onClick={handleResend}
                    disabled={isSending || cooldown > 0}
                    variant="outline"
                    className="mt-6 w-full h-12 rounded-full font-semibold text-sm"
                >
                    {isSending
                        ? <><Loader2 className="mr-2 size-4 animate-spin" />Sending…</>
                        : cooldown > 0
                        ? `Resend in ${formatCooldown(cooldown)}`
                        : <><RotateCcw className="mr-2 size-4" />Resend verification email</>
                    }
                </Button>
                {sent && cooldown > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        Email sent — check your inbox.
                    </p>
                )}

                <p className="mt-6 text-sm text-muted-foreground">
                    Already verified?{" "}
                    <Link href="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
                        Sign in
                    </Link>
                </p>

                <Link
                    href="/register"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    Back to register
                </Link>
            </div>
        </div>
    );
}
