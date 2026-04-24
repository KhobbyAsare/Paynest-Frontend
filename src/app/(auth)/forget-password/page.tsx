import SplitText from "@/components/(shared-components)/SplitText";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/30">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
                <div className="flex h-16 items-center gap-2">
                    <Wallet className="size-10 text-primary" />
                    <SplitText text="Paynest" className="text-3xl font-bold text-primary" />
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send you a link to reset your password.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-card px-6 py-12 shadow-sm border rounded-xl sm:px-12 space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="your@email.com"
                        />
                    </div>
                    <Button type="submit" className="w-full">Send reset link</Button>

                    <div className="relative flex items-center gap-4 pt-2">
                        <div className="flex-1 border-t" />
                        <span className="text-sm text-muted-foreground">Remember your password?</span>
                        <div className="flex-1 border-t" />
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/login">Back to login</Link>
                    </Button>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Need help?{" "}
                    <Link href="/contact" className="font-semibold text-primary hover:text-primary/80">Contact support</Link>
                </p>
            </div>
        </div>
    );
}
