export type ReturnStatus = "requested" | "approved" | "rejected";

export type ReturnReason =
    | "defective"
    | "wrong_item"
    | "customer_changed_mind"
    | "damaged_in_transit"
    | "duplicate_order"
    | "other";

export type RefundMethod = "cash" | "bank transfer" | "mobile transfer";

export interface CreateReturnItemInput {
    order_item_id: number;
    quantity_returned: number;
    reason: ReturnReason;
    restock?: boolean;
    notes?: string;
}

export interface CreateReturnRequest {
    order_id: number;
    notes?: string;
    items: CreateReturnItemInput[];
}

export interface ReturnItemResponse {
    id: number;
    return_id: number;
    order_item_id: number;
    product_id: number;
    quantity_returned: number;
    reason: ReturnReason;
    restock: boolean;
    subtotal_amount: number;
    tax_amount: number;
    total_amount: number;
    notes: string | null;
}

export interface ReturnResponse {
    id: number;
    organization_id: number;
    shop_id: number;
    order_id: number;
    return_number: string;
    status: ReturnStatus;
    refund_subtotal: number;
    refund_tax_amount: number;
    refund_total: number;
    requested_by: number;
    approved_by: number | null;
    rejection_reason: string | null;
    notes: string | null;
    requested_at: string;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    items: ReturnItemResponse[];
}

export interface ReturnDecisionRequest {
    approved: boolean;
    refund_method?: RefundMethod;
    rejection_reason?: string;
}

export interface ReturnsListResponse {
    items: ReturnResponse[];
    total: number;
    skip: number;
    limit: number;
}

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
    defective: "Defective",
    wrong_item: "Wrong Item",
    customer_changed_mind: "Customer Changed Mind",
    damaged_in_transit: "Damaged in Transit",
    duplicate_order: "Duplicate Order",
    other: "Other",
};
