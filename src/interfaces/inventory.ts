export interface InventoryResponse {
    id: number,
    product_id: number,
    product_name?: string,
    shop_id: number,
    organization_id: number,
    current_stock: number,
    minimum_stock: number,
    maximum_stock: number,
    reorder_point: number,
    reorder_quantity: number,
    aisle: string,
    shelf: string,
    bin_location: string,
    unit_of_measurement: string,
    on_sale: boolean,
    last_restocked: string,
    is_active: boolean,
    needs_reorder: boolean,
    is_low_stock: boolean,
    is_out_of_stock: boolean,
    created_at: string,
    updated_at: string
}

export interface CreateInventoryRequest {
    product_id: number,
    current_stock: number,
    minimum_stock: number,
    maximum_stock: number,
    reorder_point: number,
    reorder_quantity: number,
    aisle: string,
    shelf: string,
    bin_location: string,
    unit_of_measurement: string,
    on_sale: boolean,
    is_active: boolean
}

export interface InventoryStats {
    total_items: number,
    low_stock_items: number,
    out_of_stock_items: number,
    needs_reorder_items: number,
    total_inventory_value: number
}

export interface UpdateInventoryRequest {
    current_stock: number,
    minimum_stock: number,
    maximum_stock: number,
    reorder_point: number,
    reorder_quantity: number,
    aisle: string,
    shelf: string,
    bin_location: string,
    unit_of_measurement: string,
    on_sale: boolean,
    is_active: boolean
}

export interface AdjustInventoryStockRequest {
    adjustment_quantity: number,
    reason: string
}