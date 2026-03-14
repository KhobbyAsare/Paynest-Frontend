export type OrderType = "sale" | "return" | "exchange";
export type OrderStatus = "initiated" | "preparing" | "ready" | "transported" | "delivered";
export type PaymentMethod = "bank transfer" | "mobile transfer" | "cash";
export type PaymentStatus = "paid" | "unpaid" | "failed";

export interface WalkInsRequest {
    shop_id: number,
    order_type: OrderType,
    order_status: OrderStatus,
    customer_id: null,
    items: {
        product_id: number,
        quantity: number,
        notes: string
    }[],
    payment: {
        method: PaymentMethod,
        status: PaymentStatus,
        amount_paid: number
    },
    delivery_amount: number,
    discount_amount?: number,
    is_delivered: boolean,
    delivery_address: string | null,
    actual_delivery_date: null,
    expected_delivery_date: null
}


export interface OrderRequest {
    shop_id: number,
    order_type: OrderType,
    order_status: OrderStatus,
    customer_id: number,
    items: {
        product_id: number,
        quantity: number
    }[],
    payment: {
        method: PaymentMethod,
        status: PaymentStatus,
        amount_paid: number
    },
    delivery_amount: number,
    discount_amount?: number,
    is_delivered: boolean,
    delivery_address: string | null,
    actual_delivery_date: string,
    expected_delivery_date: string
}

export interface OrderWalkInsResponse {
    customer_id: number,
    shop_id: number,
    order_type: OrderType,
    order_status: OrderStatus,
    is_delivered: boolean,
    delivery_address: string,
    expected_delivery_date: string,
    actual_delivery_date: string,
    delivery_amount: number,
    payment: {
        method: PaymentMethod,
        status: PaymentStatus,
        amount_paid: number
    },
    items: [],
    id: number,
    organization_id: number,
    order_number: string,
    attendant_id: number,
    subtotal: number,
    tax_amount: number,
    discount_amount: number,
    total_amount: number,
    amount_paid: number,
    amount_due: number,
    payment_method: PaymentMethod,
    payment_status: PaymentStatus,
    order_date: string,
    order_time: string,
    close_at: string,
    created_at: string,
    updated_at: string,
    customer: {
        customer_code: string,
        first_name: string,
        last_name: string,
        email: string,
        phone: string,
        date_of_birth: string,
        gender: string,
        address: string,
        city: string,
        state: string,
        country: string,
        postal_code: string,
        loyalty_points: number,
        loyalty_tier: string,
        preferred_payment_method: string,
        communication_preferences: {
            email: boolean,
            sms: boolean,
            phone: boolean,
            marketing_emails: boolean
        },
        notes: string,
        is_active: boolean,
        id: number,
        organization_id: number,
        created_at: string,
        updated_at: string
    },
    payments: []
}