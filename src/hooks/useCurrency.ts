import { useAuthStore } from "@/(zustand-store)/authStore";
import { formatCurrency } from "@/lib/currency";

// Returns a bound formatter that uses the logged-in org's currency code.
// Usage: const fmt = useCurrency(); fmt(29.99) → "GH₵29.99" / "$29.99" / etc.
export function useCurrency(): (amount: number) => string {
    const currency = useAuthStore((s) => s.user?.organization?.currency ?? "GHS");
    return (amount: number) => formatCurrency(amount, currency);
}

// Returns just the currency code (e.g., "GHS", "USD") for form defaults.
export function useOrgCurrency(): string {
    return useAuthStore((s) => s.user?.organization?.currency ?? "GHS");
}
