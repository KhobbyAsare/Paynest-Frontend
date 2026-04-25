type Row = Record<string, unknown>;

function escapeCell(value: unknown): string {
    const s = String(value ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export function downloadCsv(filename: string, rows: Row[]) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.map(escapeCell).join(','),
        ...rows.map(row => headers.map(h => escapeCell(row[h])).join(',')),
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
