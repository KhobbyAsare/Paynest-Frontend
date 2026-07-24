export interface PaymentRequest {
    order_id: number;
    payment_number: string;
    payment_method: string;
    amount: number;
    currency?: string;
    exchange_rate?: number;
    card_last_four?: string | null;
    card_brand?: string | null;
    authorization_code?: string | null;
    mobile_provider?: string | null;
    mobile_number?: string | null;
    transaction_id?: string | null;
    check_number?: string | null;
    bank_name?: string | null;
    collected_by?: number | null;
}

export interface PaymentResponse {
    id: number;
    order_id: number;
    payment_number: string;
    payment_method: string;
    amount: number;
    currency: string;
    exchange_rate: number;
    card_last_four: string | null;
    card_brand: string | null;
    authorization_code: string | null;
    mobile_provider: string | null;
    mobile_number: string | null;
    transaction_id: string | null;
    check_number: string | null;
    bank_name: string | null;
    status: string;
    collected_by: number | null;
    verified_by: number | null;
    payment_date: string;
    payment_time: string;
    created_at: string;
    updated_at: string;
}

export interface PaymentUpdateRequest {
    status?: string;
    verified_by?: number | null;
    card_last_four?: string | null;
    card_brand?: string | null;
    authorization_code?: string | null;
    mobile_provider?: string | null;
    mobile_number?: string | null;
    transaction_id?: string | null;
    check_number?: string | null;
    bank_name?: string | null;
}