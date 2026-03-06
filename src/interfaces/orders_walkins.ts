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
    items: {
        product_id: number,
        quantity: number,
        notes: string
    }[],
    id: number,
    organization_id: number,
    order_number: string,
    attendant_id: number,
    order_date: string,
    order_time: string,
    close_at: string,
    created_at: string,
    updated_at: string
}