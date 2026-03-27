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
import { GetProductByBarcode } from "@/(api-handlers)/productsHandler";
import { ProductResponse } from "@/interfaces/products";
import { Scan, Keyboard, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductFound: (product: ProductResponse) => void;
}

type ScanMode = 'camera' | 'manual';
type ScanState = 'idle' | 'scanning' | 'loading' | 'found' | 'error';

export function BarcodeScannerModal({ isOpen, onClose, onProductFound }: Readonly<BarcodeScannerModalProps>) {
    const [mode, setMode] = useState<ScanMode>('camera');
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [manualBarcode, setManualBarcode] = useState('');
    const [lastScanned, setLastScanned] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerDivId = "barcode-scanner-div";

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                // State 2 = SCANNING
                if (state === 2) {
                    await scannerRef.current.stop();
                }
            } catch {
                // ignore stop errors
            }
            scannerRef.current = null;
        }
        setScanState('idle');
    };

    const handleBarcodeDetected = async (barcode: string) => {
        if (barcode === lastScanned) return; // debounce duplicate scans
        setLastScanned(barcode);
        setScanState('loading');
        await stopScanner();
        try {
            const product = await GetProductByBarcode(barcode);
            setScanState('found');
            toast.success(`Found: ${product.name}`);
            onProductFound(product);
            setTimeout(() => {
                setScanState('idle');
                setLastScanned('');
                onClose();
            }, 800);
        } catch {
            setScanState('error');
            toast.error(`No product found for barcode: ${barcode}`);
            setTimeout(() => {
                setScanState('idle');
                setLastScanned('');
            }, 2000);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            setManualBarcode('');
            setLastScanned('');
            setScanState('idle');
            return;
        }

        if (mode === 'camera' && isOpen) {
            // Small delay to ensure DOM element is rendered
            const timer = setTimeout(async () => {
                const el = document.getElementById(scannerDivId);
                if (!el) return;
                try {
                    const scanner = new Html5Qrcode(scannerDivId);
                    scannerRef.current = scanner;
                    setScanState('scanning');
                    await scanner.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 150 } },
                        handleBarcodeDetected,
                        () => { /* ignore scan errors */ }
                    );
                } catch (err: unknown) {
                    console.error("Camera error:", err);
                    setScanState('error');
                    toast.error("Could not access camera. Use manual entry instead.");
                    setMode('manual');
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
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <Scan className="size-5 text-primary" />
                        Barcode Scanner
                    </DialogTitle>
                </DialogHeader>

                {/* Mode tabs */}
                <div className="flex border-b border-slate-100">
                    {[
                        { id: 'camera' as ScanMode, label: 'Camera Scan', icon: <Scan className="size-3.5" /> },
                        { id: 'manual' as ScanMode, label: 'Manual Entry', icon: <Keyboard className="size-3.5" /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={async () => {
                                await stopScanner();
                                setMode(tab.id);
                                setManualBarcode('');
                                setLastScanned('');
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                                mode === tab.id
                                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {mode === 'camera' ? (
                        <div className="space-y-4">
                            {/* Scanner viewport */}
                            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
                                <div id={scannerDivId} className="w-full h-full" />
                                {scanState === 'loading' && (
                                    <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="size-8 text-white animate-spin" />
                                        <p className="text-white text-sm font-medium">Looking up product…</p>
                                    </div>
                                )}
                                {scanState === 'found' && (
                                    <div className="absolute inset-0 bg-emerald-900/80 flex flex-col items-center justify-center gap-2">
                                        <CheckCircle2 className="size-10 text-emerald-400" />
                                        <p className="text-white text-sm font-medium">Product found!</p>
                                    </div>
                                )}
                                {scanState === 'error' && (
                                    <div className="absolute inset-0 bg-rose-900/80 flex flex-col items-center justify-center gap-2">
                                        <AlertCircle className="size-10 text-rose-400" />
                                        <p className="text-white text-sm font-medium">Product not found</p>
                                    </div>
                                )}
                                {(scanState === 'idle') && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                                        <Loader2 className="size-6 animate-spin" />
                                        <p className="text-xs">Starting camera…</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-xs text-slate-400">
                                Point your camera at a barcode to scan it automatically.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Enter Barcode / SKU</label>
                                <Input
                                    autoFocus
                                    value={manualBarcode}
                                    onChange={(e) => setManualBarcode(e.target.value)}
                                    placeholder="Scan or type barcode here…"
                                    className="rounded-lg font-mono"
                                    disabled={scanState === 'loading'}
                                />
                                <p className="text-xs text-slate-400">
                                    Physical barcode scanners will auto-fill this field.
                                </p>
                            </div>
                            {scanState === 'found' && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    <span className="text-sm text-emerald-700 font-medium">Product found and added to cart!</span>
                                </div>
                            )}
                            {scanState === 'error' && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border border-rose-200">
                                    <AlertCircle className="size-4 text-rose-500" />
                                    <span className="text-sm text-rose-700">No product found for this barcode.</span>
                                </div>
                            )}
                            <div className="flex gap-2 pt-1">
                                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                                    <X className="size-4 mr-1" /> Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={!manualBarcode.trim() || scanState === 'loading'}
                                >
                                    {scanState === 'loading' ? (
                                        <><Loader2 className="size-4 animate-spin mr-1" /> Searching…</>
                                    ) : (
                                        <><Scan className="size-4 mr-1" /> Find Product</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
