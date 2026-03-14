import { InventoryResponse } from "./inventory";

export interface ProductRequest {
    name: string,
    description: string,
    category_id: number,
    brand: string,
    barcode: string,
    sku: string,
    cost_price: number,
    selling_price: number,
    markup_percentage: number,
    tax_rate: number,
    is_taxable: boolean,
    is_active: boolean
}

export interface ProductResponse {
    name: string,
    description: string,
    category_id: number,
    brand: string,
    barcode: string,
    sku: string,
    cost_price: number,
    selling_price: number,
    markup_percentage: number,
    tax_rate: number,
    is_taxable: boolean,
    is_active: boolean,
    id: number,
    organization_id: number,
    shop_id: number,
    image_url?: string,
    stock_quantity: number,
    inventory?: InventoryResponse,
    category?: string,
    created_at: string,
    updated_at: string
}
