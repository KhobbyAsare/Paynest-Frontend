import { AdjustInventoryStockRequest, CreateInventoryRequest, InventoryResponse, InventoryStats, UpdateInventoryRequest } from "@/interfaces/inventory";
import apiClient from "@/lib/apiClient";


export const CreateInventory = async (inventory_data: CreateInventoryRequest): Promise<InventoryResponse> => {
    try {
        const response = await apiClient.post(`/inventory/`, inventory_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllInventory = async (low_stock_only: boolean, out_of_stock_only: boolean, needs_reorder_only: boolean, shopId?: number): Promise<InventoryResponse[]> => {
    try {
        const response = await apiClient.get(`/inventory/`, {
            params: {
                low_stock_only,
                out_of_stock_only,
                needs_reorder_only,
                shop_id: shopId
            },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetInventoryByID = async (inventory_id: number): Promise<InventoryResponse> => {
    try {
        const response = await apiClient.get(`/inventory/${inventory_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetInventoryStatistics = async (shopId?: number): Promise<InventoryStats> => {
    try {
        const response = await apiClient.get(`/inventory/stats`, {
            params: { shop_id: shopId },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateInventory = async (inventory_id: number, inventory_data: UpdateInventoryRequest): Promise<InventoryResponse> => {
    try {
        const response = await apiClient.put(`/inventory/${inventory_id}`, inventory_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteInventoryByID = async (inventory_id: number) => {
    try {
        const response = await apiClient.delete(`/inventory/${inventory_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetInventoryByProduct = async (product_id: number): Promise<InventoryResponse> => {
    try {
        const response = await apiClient.get(`/inventory/product/${product_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const AdjustInventoryStock = async (inventory_id: number, inventory_data: AdjustInventoryStockRequest): Promise<InventoryResponse> => {
    try {
        const response = await apiClient.put(`/inventory/${inventory_id}/adjust`, inventory_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
