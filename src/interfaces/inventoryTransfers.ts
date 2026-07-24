export type TransferStatus = "requested" | "approved" | "rejected" | "shipped" | "received" | "cancelled";

export interface CreateTransferItemInput {
    product_id: number;
    quantity: number;
    notes?: string;
}

export interface CreateTransferRequest {
    source_shop_id: number;
    destination_shop_id: number;
    notes?: string;
    items: CreateTransferItemInput[];
}

export interface TransferItemResponse {
    id: number;
    transfer_id: number;
    source_product_id: number;
    destination_product_id: number;
    quantity: number;
    notes: string | null;
}

export interface TransferResponse {
    id: number;
    organization_id: number;
    source_shop_id: number;
    destination_shop_id: number;
    transfer_number: string;
    status: TransferStatus;
    requested_by: number;
    approved_by: number | null;
    shipped_by: number | null;
    received_by: number | null;
    shipped_at: string | null;
    received_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
    requested_at: string;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    items: TransferItemResponse[];
}

export interface TransferDecisionRequest {
    approved: boolean;
    rejection_reason?: string;
}

export interface TransfersListResponse {
    items: TransferResponse[];
    total: number;
    skip: number;
    limit: number;
}
