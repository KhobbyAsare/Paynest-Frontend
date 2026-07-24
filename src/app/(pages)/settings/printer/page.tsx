"use client";

import { useState, useEffect, useCallback } from "react";
import { printerService } from "@/lib/printerService";
import { buildReceiptBytes } from "@/lib/escpos";
import PageHeader from "@/components/(shared-components)/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Printer,
    Usb,
    CheckCircle2,
    CircleAlert,
    Loader2,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAscii } from "@/lib/currency";

const PAPER_OPTIONS: { label: string; value: 58 | 80; desc: string }[] = [
    { label: "58 mm", value: 58, desc: "32 chars / line — smaller desktop printers" },
    { label: "80 mm", value: 80, desc: "42 chars / line — standard POS printers" },
];

export default function PrinterSettingsPage() {
    const [connected, setConnected] = useState(false);
    const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
    const [supported, setSupported] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [testing, setTesting] = useState(false);
    const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
    const orgCurrency = useOrgCurrency();

    const syncState = useCallback(() => {
        setConnected(printerService.isConnected());
        setDeviceLabel(printerService.getDeviceLabel());
    }, []);

    useEffect(() => {
        setSupported(printerService.isSupported());
        const settings = printerService.getSettings();
        setPaperWidth(settings.paperWidth);
        // Try to reconnect to a previously authorised device
        printerService.tryAutoConnect().then(syncState);
    }, [syncState]);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await printerService.requestConnect();
            syncState();
            toast.success(`Connected to ${printerService.getDeviceLabel()}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to connect";
            // User cancelled the picker — no toast needed
            if (!msg.includes("No device selected")) {
                toast.error(msg);
            }
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        await printerService.disconnect();
        syncState();
        toast.success("Printer disconnected");
    };

    const handlePaperWidth = (w: 58 | 80) => {
        setPaperWidth(w);
        printerService.saveSettings({ paperWidth: w });
    };

    const handleTestPrint = async () => {
        if (!printerService.isConnected()) {
            toast.error("Connect a printer first");
            return;
        }
        setTesting(true);
        try {
            const settings = printerService.getSettings();
            const testData = {
                orgName: "Paynest POS",
                receiptType: "Test Receipt",
                date: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
                time: new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                items: [
                    { name: "Test Item A", qty: 2, total: formatCurrencyAscii(20.00, orgCurrency) },
                    { name: "Test Item B", qty: 1, total: formatCurrencyAscii(15.50, orgCurrency) },
                ],
                subtotal: formatCurrencyAscii(35.50, orgCurrency),
                tax: formatCurrencyAscii(1.42, orgCurrency),
                discount: null,
                total: formatCurrencyAscii(36.92, orgCurrency),
                paymentMethod: "Cash",
                paperWidth: settings.paperWidth,
            };
            const bytes = buildReceiptBytes(testData);
            await printerService.print(testData);
            // bytes variable was just for reference; printerService.print() rebuilds internally
            void bytes;
            toast.success("Test receipt printed!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Print failed");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Printer Settings"
                description="Connect a USB thermal printer for hardware receipt printing."
            />

            {/* Browser support warning */}
            {!supported && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                    <div>
                        <p className="text-sm font-medium text-warning-foreground">
                            WebUSB not supported
                        </p>
                        <p className="mt-0.5 text-xs text-warning-foreground/80">
                            Hardware receipt printing requires Chrome or Microsoft Edge. Other
                            browsers will use the browser print dialog as a fallback.
                        </p>
                    </div>
                </div>
            )}

            {/* Connection status */}
            <Card className="rounded-2xl p-6">
                <div className="mb-6 flex items-center gap-3 border-b pb-5">
                    <div
                        className={cn(
                            "flex size-10 items-center justify-center rounded-full",
                            connected
                                ? "bg-success/10"
                                : "bg-muted",
                        )}
                    >
                        <Printer
                            className={cn(
                                "size-5",
                                connected ? "text-success" : "text-muted-foreground",
                            )}
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">USB Thermal Printer</p>
                        <p className="text-sm text-muted-foreground">
                            {connected
                                ? `Connected — ${deviceLabel ?? "Unknown device"}`
                                : "No printer connected"}
                        </p>
                    </div>
                    <div className="ml-auto">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                                connected
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            <span
                                className={cn(
                                    "size-1.5 rounded-full",
                                    connected ? "bg-success" : "bg-muted-foreground",
                                )}
                            />
                            {connected ? "Online" : "Offline"}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {!connected ? (
                        <Button
                            onClick={handleConnect}
                            disabled={!supported || connecting}
                            className="gap-2"
                        >
                            {connecting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Usb className="size-4" />
                            )}
                            {connecting ? "Connecting…" : "Connect Printer"}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleDisconnect}
                                className="gap-2"
                            >
                                <Usb className="size-4" />
                                Disconnect
                            </Button>
                            <Button
                                onClick={handleTestPrint}
                                disabled={testing}
                                className="gap-2"
                            >
                                {testing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Zap className="size-4" />
                                )}
                                {testing ? "Printing…" : "Print Test Receipt"}
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            {/* Paper width */}
            <Card className="rounded-2xl p-6">
                <div className="mb-5 flex items-center gap-3 border-b pb-5">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                        <Printer className="size-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Paper Width</p>
                        <p className="text-sm text-muted-foreground">
                            Match this to your thermal paper roll size.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {PAPER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handlePaperWidth(opt.value)}
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                paperWidth === opt.value
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-border hover:border-primary/50",
                            )}
                        >
                            <div
                                className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                                    paperWidth === opt.value
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground",
                                )}
                            >
                                {paperWidth === opt.value && (
                                    <CheckCircle2 className="size-3 text-primary-foreground" />
                                )}
                            </div>
                            <div>
                                <Label className="cursor-pointer text-sm font-semibold">
                                    {opt.label}
                                </Label>
                                <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {/* How it works */}
            <Card className="rounded-2xl p-6">
                <div className="mb-4 flex items-center gap-3 border-b pb-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-info/10">
                        <Usb className="size-5 text-info" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">How it works</p>
                        <p className="text-sm text-muted-foreground">
                            Direct USB printing via WebUSB API
                        </p>
                    </div>
                </div>
                <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            1
                        </span>
                        Plug your USB thermal printer into this computer.
                    </li>
                    <li className="flex gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            2
                        </span>
                        Click <strong className="text-foreground">Connect Printer</strong> — a
                        browser popup asks you to choose the device.
                    </li>
                    <li className="flex gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            3
                        </span>
                        Print a test receipt to verify alignment and paper width.
                    </li>
                    <li className="flex gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            4
                        </span>
                        On the POS sales screen, the <strong className="text-foreground">Print Receipt</strong> button
                        will automatically send to the hardware printer. If no printer is
                        connected, it falls back to the browser print dialog.
                    </li>
                </ol>
                <p className="mt-4 text-xs text-muted-foreground">
                    Requires Chrome or Edge. Compatible with Epson, BIXOLON, Star Micronics, and
                    most generic 58 mm / 80 mm ESC/POS thermal printers.
                </p>
            </Card>
        </div>
    );
}
