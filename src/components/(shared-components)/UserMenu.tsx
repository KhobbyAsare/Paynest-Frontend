"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, KeyRound, LogOut, Settings, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { LogoutHandler } from "@/(api-handlers)/logoutHandler";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Role = "superadmin" | "admin" | "manager" | "attendant";

const ROLE_LABEL: Record<Role, string> = {
    superadmin: "Super Admin",
    admin: "Administrator",
    manager: "Manager",
    attendant: "Attendant",
};

function initials(first?: string | null, last?: string | null) {
    const f = (first ?? "").trim();
    const l = (last ?? "").trim();
    return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || "U";
}

interface UserMenuProps {
    /** Compact icon-only trigger for the top bar; full row trigger for the sidebar footer. */
    variant?: "compact" | "row";
    align?: "start" | "center" | "end";
    className?: string;
}

export function UserMenu({
    variant = "compact",
    align = "end",
    className,
}: UserMenuProps) {
    const router = useRouter();
    const { user, accessToken, clearAuth } = useAuthStore();
    const role = (user?.role as Role) ?? "attendant";

    const handleLogout = async () => {
        try {
            if (accessToken) await LogoutHandler({ token: accessToken });
        } catch {
            // 401 is expected when the token is already expired — local auth is still cleared
        } finally {
            clearAuth();
            toast.success("Logged out successfully");
            router.push("/login");
        }
    };

    const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";

    const avatar = (
        <Avatar className="size-8">
            <AvatarImage src={user?.profile_pic ?? undefined} alt={fullName} />
            <AvatarFallback className="text-xs font-medium">
                {initials(user?.first_name, user?.last_name)}
            </AvatarFallback>
        </Avatar>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {variant === "row" ? (
                    <button
                        type="button"
                        className={cn(
                            "hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            className,
                        )}
                    >
                        {avatar}
                        <div className="min-w-0 flex-1">
                            <p className="text-sidebar-foreground truncate text-sm font-medium">
                                {fullName}
                            </p>
                            <p className="text-sidebar-foreground/70 truncate text-xs">
                                {user?.email}
                            </p>
                        </div>
                        <ChevronsUpDown className="text-sidebar-foreground/70 size-4" />
                    </button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="User menu"
                        className={cn("size-9 rounded-full", className)}
                    >
                        {avatar}
                    </Button>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align={align} sideOffset={8} className="w-60">
                <DropdownMenuLabel className="flex items-center gap-2">
                    {avatar}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{fullName}</p>
                        <p className="text-muted-foreground truncate text-xs font-normal">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>

                <div className="px-2 pb-2">
                    <Badge variant="secondary" className="text-xs">
                        {ROLE_LABEL[role]}
                    </Badge>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/settings/profile">
                            <User />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings/security">
                            <KeyRound />
                            Security
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings/notifications">
                            <Settings />
                            Notification settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-default focus:bg-transparent"
                >
                    <ThemeToggle />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => {
                        e.preventDefault();
                        handleLogout();
                    }}
                >
                    <LogOut />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default UserMenu;
