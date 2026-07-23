export type ReceiptFormat = "full" | "thermal";

export interface ReceiptConfigResponse {
    id: number;
    organization_id: number;
    logo_url: string | null;
    header_note: string | null;
    footer_text: string | null;
    show_tax_details: boolean;
    updated_at: string;
}

export interface UpdateReceiptConfigRequest {
    header_note?: string | null;
    footer_text?: string | null;
    show_tax_details?: boolean;
}

export interface UploadReceiptLogoResponse {
    logo_url: string;
}

export interface EmailReceiptRequest {
    email?: string;
}

export interface EmailReceiptResponse {
    sent_to: string;
}
