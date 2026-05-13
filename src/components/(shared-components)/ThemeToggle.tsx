"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex w-full items-center gap-2">
            <span className="flex-1 text-sm">Appearance</span>
            <div className="flex items-center gap-0.5 rounded-md border p-0.5">
                {THEMES.map(({ value, icon: Icon, label }) => (
                    <button
                        key={value}
                        type="button"
                        aria-label={label}
                        onClick={() => setTheme(value)}
                        className={cn(
                            "flex size-6 items-center justify-center rounded transition-colors",
                            theme === value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="size-3.5" />
                    </button>
                ))}
            </div>
        </div>
    );
}
