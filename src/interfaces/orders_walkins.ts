export interface OrderWalkInsRequest {
    customer_id: number,
    shop_id: number,
    order_type: string,
    order_status: string,
    is_delivered: boolean,
    delivery_address: string,
    expected_delivery_date: string,
    actual_delivery_date: string,
    delivery_amount: number,
    payment: {
        method: string,
        status: string,
        amount_paid: number
    },
    items: {
        product_id: number,
        quantity: number,
        notes: string
    }[]
}

export interface OrderWalkInsResponse {
    customer_id: number,
    shop_id: number,
    order_type: string,
    order_status: string,
    is_delivered: boolean,
    delivery_address: string,
    expected_delivery_date: string,
    actual_delivery_date: string,
    delivery_amount: number,
    payment: {
        method: string,
        status: string,
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