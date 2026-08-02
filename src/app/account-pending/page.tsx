"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, UserCog, Loader2, RefreshCcw, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { getUserData } from "@/(api-handlers)/userHandler";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { Button } from "@/components/ui/button";

export default function AccountPendingPage() {
    const router = useRouter();
    const { user, updateUser, clearAuth } = useAuthStore();
    const [checking, setChecking] = useState(false);

    const handleCheckAgain = async () => {
        setChecking(true);
        try {
            const u = await getUserData();
            updateUser(u);
            if (u.employee_profile) {
                toast.success("Your employee profile is set up. Redirecting…");
                router.push(u.role === "attendant" ? "/sales" : u.role === "manager" ? "/orders" : "/dashboard");
                return;
            }
            toast.info("Still not set up yet. Please check back later or contact your administrator.");
        } catch (error) {
            handleErrorMessage(error, "Failed to check your account status.");
        } finally {
            setChecking(false);
        }
    };

    const handleSignOut = () => {
        clearAuth();
        router.push("/login");
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
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-warning/10 border border-warning/20">
                    <UserCog className="size-7 text-warning-foreground" />
                </div>

                <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
                    Account setup pending
                </h1>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
                    {user?.first_name ? `Hi ${user.first_name}, your` : "Your"} account doesn&apos;t have an employee
                    profile set up yet. Contact your organization administrator so they can finish setting you up —
                    you&apos;ll need this before you can access Paynest.
                </p>

                {user?.email && (
                    <p className="mt-4 text-xs text-muted-foreground">
                        Signed in as <span className="font-semibold text-foreground">{user.email}</span>
                    </p>
                )}

                <Button
                    onClick={handleCheckAgain}
                    disabled={checking}
                    className="mt-8 w-full h-12 rounded-full font-semibold text-sm"
                >
                    {checking
                        ? <><Loader2 className="mr-2 size-4 animate-spin" />Checking…</>
                        : <><RefreshCcw className="mr-2 size-4" />Check again</>
                    }
                </Button>

                <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="mt-3 w-full h-12 rounded-full font-semibold text-sm"
                >
                    <LogOut className="mr-2 size-4" /> Sign out
                </Button>
            </div>
        </div>
    );
}
