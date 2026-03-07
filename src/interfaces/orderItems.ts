export interface OrderItemRequest {
    product_id: number;
    quantity: number;
    inventory_id?: number;
    unit_price?: number;
    tax_rate?: number;
    discount_percentage?: number;
    notes?: string;
}

export interface OrderItemResponse {
    id: number;
    order_id: number;
    product_id: number;
    inventory_id: number;
    product_name: string;
    product_sku: string;
    unit_price: number;
    quantity: number;
    quantity_cancelled: number;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    discount_percentage: number;
    discount_amount: number;
    total_amount: number;
    notes: string;
    item_status: string;
    created_at: string;
}


export interface UpdateOrderItemRequest {
    quantity: number;
    quantity_cancelled?: number;
    inventory_id?: number;
    unit_price?: number;
    tax_rate?: number;
    discount_percentage?: number;
    notes?: string;
    item_status: string;
}