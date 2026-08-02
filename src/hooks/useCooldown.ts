import { useEffect, useState } from "react";

// Ticking countdown in seconds, e.g. for resend-email rate-limit cooldowns.
// Usage: const [cooldown, setCooldown] = useCooldown(); setCooldown(120) to start it.
export function useCooldown(): [number, React.Dispatch<React.SetStateAction<number>>] {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (seconds <= 0) return;
        const id = setInterval(() => setSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(id);
    }, [seconds]);

    return [seconds, setSeconds];
}

export function formatCooldown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// Same idea as useCooldown, but keyed — for per-row cooldowns in a list/table.
// Usage: const [cooldowns, startCooldown] = useKeyedCooldown(); startCooldown(userId, 120)
export function useKeyedCooldown(): [Record<number, number>, (key: number, seconds: number) => void] {
    const [cooldowns, setCooldowns] = useState<Record<number, number>>({});

    useEffect(() => {
        if (Object.keys(cooldowns).length === 0) return;
        const id = setInterval(() => {
            setCooldowns((prev) => {
                const next: Record<number, number> = {};
                for (const [k, v] of Object.entries(prev)) {
                    if (v > 1) next[Number(k)] = v - 1;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [cooldowns]);

    const startCooldown = (key: number, seconds: number) => {
        setCooldowns((prev) => ({ ...prev, [key]: seconds }));
    };

    return [cooldowns, startCooldown];
}
