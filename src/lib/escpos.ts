// ESC/POS thermal printer command builder.
// All text is coerced to ASCII (non-ASCII chars → '?') because most
// thermal printers use Code Page 850 / 437 and will misprint UTF-8.

export interface EscPosReceiptData {
    orgName: string;
    receiptType: string;
    date: string;
    time: string;
    items: { name: string; qty: number; total: string }[];
    subtotal: string;
    tax: string;
    discount: string | null;
    total: string;
    paymentMethod: string;
    paperWidth: 58 | 80;
}

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const COLS: Record<number, number> = { 58: 32, 80: 42 };

function ascii(text: string): number[] {
    const out: number[] = [];
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        out.push(c < 128 ? c : 0x3f);
    }
    return out;
}

function ln(text: string): number[] {
    return [...ascii(text), LF];
}

function twoCol(left: string, right: string, width: number): number[] {
    const gap = Math.max(1, width - left.length - right.length);
    return ln(left + " ".repeat(gap) + right);
}

function centered(text: string, width: number): number[] {
    const t = text.substring(0, width);
    const pad = Math.max(0, Math.floor((width - t.length) / 2));
    return ln(" ".repeat(pad) + t);
}

export function buildReceiptBytes(data: EscPosReceiptData): Uint8Array {
    const W = COLS[data.paperWidth] ?? 42;
    const buf: number[] = [];
    const p = (...bytes: number[]) => buf.push(...bytes);

    // Initialise
    p(ESC, 0x40);

    // Org name — bold + double size, centered
    p(ESC, 0x61, 1);       // center
    p(ESC, 0x45, 1);       // bold on
    p(ESC, 0x21, 0x11);    // double width + height (halves usable columns)
    buf.push(...centered(data.orgName.substring(0, Math.floor(W / 2)), Math.floor(W / 2)));
    p(ESC, 0x21, 0x00);    // normal size
    p(ESC, 0x45, 0);       // bold off

    // Receipt type
    buf.push(...centered(data.receiptType, W));
    p(LF);

    // Date / time
    p(ESC, 0x61, 0);       // left
    buf.push(...twoCol(data.date, data.time, W));
    buf.push(...ln("-".repeat(W)));

    // Line items
    for (const item of data.items) {
        const qtyStr = `x${item.qty}`;
        const maxName = W - item.total.length - qtyStr.length - 2;
        const name = item.name.substring(0, Math.max(1, maxName));
        buf.push(...twoCol(`${name} ${qtyStr}`, item.total, W));
    }

    buf.push(...ln("-".repeat(W)));

    // Totals
    buf.push(...twoCol("Subtotal", data.subtotal, W));
    buf.push(...twoCol("Tax", data.tax, W));
    if (data.discount) {
        buf.push(...twoCol("Discount", `-${data.discount}`, W));
    }
    buf.push(...ln("-".repeat(W)));

    // Grand total — bold
    p(ESC, 0x45, 1);
    buf.push(...twoCol("TOTAL", data.total, W));
    p(ESC, 0x45, 0);

    p(LF);

    // Payment + footer — centered
    p(ESC, 0x61, 1);
    buf.push(...centered(`Paid via ${data.paymentMethod}`, W));
    p(LF);
    buf.push(...centered("Thank you for your purchase!", W));
    buf.push(...centered("Powered by Paynest", W));

    // Feed + partial cut
    p(ESC, 0x64, 4);
    p(GS, 0x56, 0x01);

    return new Uint8Array(buf);
}
