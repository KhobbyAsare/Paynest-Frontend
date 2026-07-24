// WebUSB thermal printer service — singleton used by both the POS modal
// and the printer settings page.
//
// WebUSB requires Chrome/Edge (not Firefox/Safari). The isSupported() check
// gates all USB calls so the app degrades gracefully in unsupported browsers.

import { buildReceiptBytes, type EscPosReceiptData } from "./escpos";

// ── Minimal WebUSB ambient declarations ───────────────────────────────────────
// TypeScript's dom lib does not ship WebUSB types. We declare only what we use.

interface WebUSBEndpoint {
    endpointNumber: number;
    direction: "in" | "out";
    type: "bulk" | "interrupt" | "isochronous";
}

interface WebUSBAlternate {
    endpoints: WebUSBEndpoint[];
}

interface WebUSBInterface {
    interfaceNumber: number;
    alternates: WebUSBAlternate[];
}

interface WebUSBConfiguration {
    interfaces: WebUSBInterface[];
}

interface WebUSBDevice {
    productName: string | undefined;
    manufacturerName: string | undefined;
    opened: boolean;
    configuration: WebUSBConfiguration | null;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: Uint8Array | ArrayBuffer): Promise<{ status: string }>;
}

interface WebUSB {
    requestDevice(options: { filters: object[] }): Promise<WebUSBDevice>;
    getDevices(): Promise<WebUSBDevice[]>;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface PrinterSettings {
    paperWidth: 58 | 80;
    autoConnect: boolean;
}

const SETTINGS_KEY = "paynest_printer_settings";

const DEFAULT_SETTINGS: PrinterSettings = {
    paperWidth: 80,
    autoConnect: true,
};

// ── Service ───────────────────────────────────────────────────────────────────

class PrinterService {
    private device: WebUSBDevice | null = null;
    private endpointNumber: number | null = null;
    private claimedInterface: number | null = null;

    // ── Settings ──────────────────────────────────────────────────────────────

    getSettings(): PrinterSettings {
        if (typeof window === "undefined") return DEFAULT_SETTINGS;
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PrinterSettings>) };
        } catch {
            // ignore parse errors
        }
        return DEFAULT_SETTINGS;
    }

    saveSettings(patch: Partial<PrinterSettings>): void {
        if (typeof window === "undefined") return;
        const next = { ...this.getSettings(), ...patch };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    }

    // ── Connection ────────────────────────────────────────────────────────────

    isSupported(): boolean {
        return typeof navigator !== "undefined" && "usb" in navigator;
    }

    isConnected(): boolean {
        return this.device !== null && this.device.opened;
    }

    getDeviceLabel(): string | null {
        if (!this.device) return null;
        const parts = [this.device.manufacturerName, this.device.productName]
            .filter(Boolean)
            .join(" ");
        return parts || "Unknown Printer";
    }

    async tryAutoConnect(): Promise<boolean> {
        if (!this.isSupported()) return false;
        if (!this.getSettings().autoConnect) return false;
        try {
            const usb = (navigator as Navigator & { usb: WebUSB }).usb;
            const devices = await usb.getDevices();
            if (devices.length > 0) {
                await this._openDevice(devices[0]);
                return true;
            }
        } catch {
            // no previously authorised devices or open failed
        }
        return false;
    }

    async requestConnect(): Promise<void> {
        if (!this.isSupported()) {
            throw new Error("WebUSB is not supported in this browser. Use Chrome or Edge.");
        }
        const usb = (navigator as Navigator & { usb: WebUSB }).usb;
        const device = await usb.requestDevice({ filters: [] });
        await this._openDevice(device);
    }

    async disconnect(): Promise<void> {
        if (!this.device) return;
        try {
            if (this.claimedInterface !== null) {
                await this.device.releaseInterface(this.claimedInterface);
            }
            await this.device.close();
        } catch {
            // ignore errors on close
        } finally {
            this.device = null;
            this.endpointNumber = null;
            this.claimedInterface = null;
        }
    }

    // ── Printing ──────────────────────────────────────────────────────────────

    async print(data: EscPosReceiptData): Promise<void> {
        if (!this.device || !this.device.opened) {
            throw new Error("Printer not connected");
        }
        if (this.endpointNumber === null) {
            throw new Error("No bulk OUT endpoint found on this device");
        }
        const bytes = buildReceiptBytes(data);
        await this.device.transferOut(this.endpointNumber, bytes);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private async _openDevice(device: WebUSBDevice): Promise<void> {
        await device.open();
        if (device.configuration === null) {
            await device.selectConfiguration(1);
        }
        // Walk interfaces to find the first bulk OUT endpoint
        for (const iface of device.configuration!.interfaces) {
            for (const alt of iface.alternates) {
                for (const ep of alt.endpoints) {
                    if (ep.direction === "out" && ep.type === "bulk") {
                        await device.claimInterface(iface.interfaceNumber);
                        this.device = device;
                        this.endpointNumber = ep.endpointNumber;
                        this.claimedInterface = iface.interfaceNumber;
                        return;
                    }
                }
            }
        }
        // Endpoint not found — close and reject
        await device.close();
        throw new Error(
            "No bulk OUT endpoint found. Make sure the device is a thermal printer and its driver is not installed (WebUSB requires no OS driver)."
        );
    }
}

export const printerService = new PrinterService();
export type { EscPosReceiptData };
