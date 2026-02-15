import { AdjustInventoryStockRequest, CreateInventoryRequest, InventoryResponse, InventoryStats, UpdateInventoryRequest } from "@/interfaces/inventory";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const CreateInventory = async (inventory_data: CreateInventoryRequest): Promise<InventoryResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/inventory/`, inventory_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllInventory = async (low_stock_only: boolean, out_of_stock_only: boolean, needs_reorder_only: boolean): Promise<InventoryResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        let mainUrl = `${url}/inventory/`
        if (low_stock_only) {
            mainUrl += `?low_stock_only=${low_stock_only}`
        }
        if (out_of_stock_only) {
            mainUrl += `?out_of_stock_only=${out_of_stock_only}`
        }
        if (needs_reorder_only) {
            mainUrl += `?needs_reorder_only=${needs_reorder_only}`
        }
        const response = await axios.get(mainUrl, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetInventoryByID = async (inventory_id: number): Promise<InventoryResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/inventory/${inventory_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetInventoryStatistics = async (): Promise<InventoryStats> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/inventory/stats`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateInventory = async (inventory_id: number, inventory_data: UpdateInventoryRequest): Promise<InventoryResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/inventory/${inventory_id}`, inventory_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteInventoryByID = async (inventory_id: number) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.delete(`${url}/inventory/${inventory_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetInventoryByProduct = async (product_id: number): Promise<InventoryResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/inventory/product/${product_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const AdjustInventoryStock = async (inventory_id: number, inventory_data: AdjustInventoryStockRequest): Promise<InventoryResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/inventory/${inventory_id}/adjust`, inventory_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}





