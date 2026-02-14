export interface StockMovementResponse {
    id: number,
    inventory_id: number,
    product_id: number,
    shop_id: number,
    organization_id: number,
    movement_type: "purchase" | "sale" | "return" | "adjustment" | "transfer_in" | "transfer_out" | "damage",
    quantity_change: number,
    quantity_before: number,
    quantity_after: number,
    reference_id: number,
    reference_type: string,
    reason: string,
    performed_by: number,
    movement_date: string,
    created_at: string
}

export interface StockMovementSummary {
    total_movements: number,
    purchases: number,
    sales: number,
    returns: number,
    adjustments: number,
    transfers_in: number,
    transfers_out: number,
    damages: number,
    net_change: number
}