import { format, isValid } from "date-fns";

export function safeFormat(
    date: string | number | Date | null | undefined,
    pattern: string,
    fallback = "—"
): string {
    if (!date) return fallback;
    const d = date instanceof Date ? date : new Date(date);
    return isValid(d) ? format(d, pattern) : fallback;
}
