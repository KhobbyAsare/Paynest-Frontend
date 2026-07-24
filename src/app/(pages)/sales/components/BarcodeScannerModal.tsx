"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { GetProductByBarcode } from "@/(api-handlers)/productsHandler";
import { ProductResponse } from "@/interfaces/products";
import {
    AlertCircle,
    CheckCircle2,
    Keyboard,
    Loader2,
    Scan,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductFound: (product: ProductResponse) => void;
}

type ScanMode = "camera" | "manual";
type ScanState = "idle" | "scanning" | "loading" | "found" | "error";

export function BarcodeScannerModal({
    isOpen,
    onClose,
    onProductFound,
}: Readonly<BarcodeScannerModalProps>) {
    const [mode, setMode] = useState<ScanMode>("camera");
    const [scanState, setScanState] = useState<ScanState>("idle");
    const [manualBarcode, setManualBarcode] = useState("");
    const [lastScanned, setLastScanned] = useState("");
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerDivId = "barcode-scanner-div";

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) {
                    await scannerRef.current.stop();
                }
            } catch {
                /* ignore */
            }
            scannerRef.current = null;
        }
        setScanState("idle");
    };

    const handleBarcodeDetected = async (barcode: string) => {
        if (barcode === lastScanned) return;
        setLastScanned(barcode);
        setScanState("loading");
        await stopScanner();
        try {
            const product = await GetProductByBarcode(barcode);
            setScanState("found");
            toast.success(`Found: ${product.name}`);
            onProductFound(product);
            setTimeout(() => {
                setScanState("idle");
                setLastScanned("");
                onClose();
            }, 800);
        } catch {
            setScanState("error");
            toast.error(`No product found for barcode: ${barcode}`);
            setTimeout(() => {
                setScanState("idle");
                setLastScanned("");
            }, 2000);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            setManualBarcode("");
            setLastScanned("");
            setScanState("idle");
            return;
        }

        if (mode === "camera" && isOpen) {
            const timer = setTimeout(async () => {
                const el = document.getElementById(scannerDivId);
                if (!el) return;
                try {
                    const scanner = new Html5Qrcode(scannerDivId);
                    scannerRef.current = scanner;
                    setScanState("scanning");
                    await scanner.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 150 } },
                        handleBarcodeDetected,
                        () => {},
                    );
                } catch (err: unknown) {
                    console.error("Camera error:", err);
                    setScanState("error");
                    toast.error("Could not access camera. Use manual entry instead.");
                    setMode("manual");
                }
            }, 300);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualBarcode.trim()) return;
        await handleBarcodeDetected(manualBarcode.trim());
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="border-border border-b px-5 pt-5 pb-3">
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Scan className="text-primary size-5" />
                        Barcode Scanner
                    </DialogTitle>
                </DialogHeader>

                <Tabs
                    value={mode}
                    onValueChange={async (v) => {
                        await stopScanner();
                        setMode(v as ScanMode);
                        setManualBarcode("");
                        setLastScanned("");
                    }}
                    className="gap-0"
                >
                    <TabsList className="bg-muted/50 mx-5 mt-4 grid w-auto grid-cols-2">
                        <TabsTrigger value="camera">
                            <Scan className="size-3.5" /> Camera
                        </TabsTrigger>
                        <TabsTrigger value="manual">
                            <Keyboard className="size-3.5" /> Manual
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="camera" className="p-5">
                        <div className="flex flex-col gap-4">
                            <div className="bg-foreground relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl">
                                <div id={scannerDivId} className="size-full" />

                                {/* Framing reticle */}
                                {scanState === "scanning" && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="relative h-[45%] w-[65%]">
                                            <span className="border-primary absolute top-0 left-0 size-6 border-t-2 border-l-2" />
                                            <span className="border-primary absolute top-0 right-0 size-6 border-t-2 border-r-2" />
                                            <span className="border-primary absolute bottom-0 left-0 size-6 border-b-2 border-l-2" />
                                            <span className="border-primary absolute right-0 bottom-0 size-6 border-r-2 border-b-2" />
                                            <div className="via-primary absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent to-transparent" />
                                        </div>
                                    </div>
                                )}

                                {scanState === "loading" && (
                                    <div className="bg-foreground/80 absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="text-background size-8 animate-spin" />
                                        <p className="text-background text-sm font-medium">
                                            Looking up product…
                                        </p>
                                    </div>
                                )}
                                {scanState === "found" && (
                                    <div className="bg-success/80 absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <CheckCircle2 className="text-success-foreground size-10" />
                                        <p className="text-success-foreground text-sm font-medium">
                                            Product found!
                                        </p>
                                    </div>
                                )}
                                {scanState === "error" && (
                                    <div className="bg-destructive/80 absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <AlertCircle className="text-destructive-foreground size-10" />
                                        <p className="text-destructive-foreground text-sm font-medium">
                                            Product not found
                                        </p>
                                    </div>
                                )}
                                {scanState === "idle" && (
                                    <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="size-6 animate-spin" />
                                        <p className="text-xs">Starting camera…</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-muted-foreground text-center text-xs">
                                Point your camera at a barcode to scan it automatically.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="manual" className="p-5">
                        <form
                            onSubmit={handleManualSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="barcode-input"
                                    className="text-foreground text-sm font-medium"
                                >
                                    Enter barcode / SKU
                                </Label>
                                <Input
                                    id="barcode-input"
                                    autoFocus
                                    value={manualBarcode}
                                    onChange={(e) => setManualBarcode(e.target.value)}
                                    placeholder="Scan or type barcode…"
                                    className="font-mono"
                                    disabled={scanState === "loading"}
                                />
                                <p className="text-muted-foreground text-xs">
                                    Hardware scanners will auto-fill this field.
                                </p>
                            </div>

                            {scanState === "found" && (
                                <div className="bg-success-muted text-success border-success/20 flex items-center gap-2 rounded-md border p-3 text-sm">
                                    <CheckCircle2 className="size-4" />
                                    Product found and added to cart.
                                </div>
                            )}
                            {scanState === "error" && (
                                <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-2 rounded-md border p-3 text-sm">
                                    <AlertCircle className="size-4" />
                                    No product found for this barcode.
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleClose}
                                >
                                    <X data-icon="inline-start" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={
                                        !manualBarcode.trim() || scanState === "loading"
                                    }
                                >
                                    {scanState === "loading" ? (
                                        <>
                                            <Loader2
                                                data-icon="inline-start"
                                                className="animate-spin"
                                            />
                                            Searching…
                                        </>
                                    ) : (
                                        <>
                                            <Scan data-icon="inline-start" />
                                            Find product
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
