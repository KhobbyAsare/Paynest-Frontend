// Currency formatting utilities.
// formatCurrency: rich display using Intl (symbols, locale-aware grouping)
// formatCurrencyAscii: plain "CODE X.XX" for ESC/POS thermal printers

const LOCALE: Record<string, string> = {
    GHS: "en-GH",
    USD: "en-US",
    GBP: "en-GB",
    EUR: "en-IE",
    NGN: "en-NG",
    KES: "en-KE",
    ZAR: "en-ZA",
    CAD: "en-CA",
    AUD: "en-AU",
};

export function formatCurrency(amount: number, currencyCode: string): string {
    try {
        const locale = LOCALE[currencyCode] ?? "en-US";
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currencyCode,
        }).format(amount);
    } catch {
        return formatCurrencyAscii(amount, currencyCode);
    }
}

// Safe for ESC/POS (no Unicode symbols, pure ASCII)
export function formatCurrencyAscii(amount: number, currencyCode: string): string {
    return `${currencyCode} ${amount.toFixed(2)}`;
}
