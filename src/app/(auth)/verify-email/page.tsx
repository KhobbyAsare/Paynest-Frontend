"use client"

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmailHandler } from "@/(api-handlers)/registrationHandler";
import { Button } from "@/components/ui/button";

type State = "loading" | "success" | "error";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [state, setState] = useState<State>("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setState("error");
            setMessage("No verification token found. Please use the link from your email.");
            return;
        }

        verifyEmailHandler(token)
            .then((res) => {
                setMessage(res?.message ?? "Email verified successfully.");
                setState("success");
            })
            .catch((err) => {
                const detail =
                    err?.response?.data?.detail ??
                    "The verification link is invalid or has expired. Please request a new one.";
                setMessage(detail);
                setState("error");
            });
    }, [token]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">

            {/* Logo */}
            <div className="mb-10 flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                    <Wallet className="size-[18px] text-primary-foreground" />
                </div>
                <span className="text-[22px] font-extrabold text-foreground">Paynest</span>
            </div>

            <div className="w-full max-w-[400px] text-center">

                {state === "loading" && (
                    <>
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-muted border border-border">
                            <Loader2 className="size-7 text-muted-foreground animate-spin" />
                        </div>
                        <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                            Verifying your email…
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">Please wait a moment.</p>
                    </>
                )}

                {state === "success" && (
                    <>
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success/10 border border-success/20">
                            <CheckCircle2 className="size-7 text-success" />
                        </div>
                        <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                            Email verified!
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{message}</p>
                        <Button asChild className="mt-8 w-full h-12 rounded-full font-semibold text-sm">
                            <Link href="/login">Continue to sign in</Link>
                        </Button>
                    </>
                )}

                {state === "error" && (
                    <>
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
                            <XCircle className="size-7 text-destructive" />
                        </div>
                        <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                            Verification failed
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{message}</p>
                        <div className="mt-8 flex flex-col gap-3">
                            <Button asChild variant="outline" className="w-full h-12 rounded-full font-semibold text-sm">
                                <Link href="/verify-email/pending">Request a new link</Link>
                            </Button>
                            <Link
                                href="/login"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
