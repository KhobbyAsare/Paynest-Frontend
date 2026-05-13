import { ProductRequest, ProductResponse } from "@/interfaces/products";
import apiClient from "@/lib/apiClient";


export const CreateProduct = async (product_data: ProductRequest): Promise<ProductResponse> => {
    try {
        const response = await apiClient.post(`/products/`, product_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const GetProducts = async (shopId?: number): Promise<ProductResponse[]> => {
    try {
        const response = await apiClient.get(`/products/`, {
            params: { shop_id: shopId },
        })
        return response.data.items
    } catch (error: unknown) {
        throw error;
    }
}

export const GetProductByID = async (product_id: number): Promise<ProductResponse> => {
    try {
        const response = await apiClient.get(`/products/${product_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateProdctDetails = async (product_id: number, product_data: ProductRequest): Promise<ProductResponse> => {
    try {
        const response = await apiClient.put(`/products/${product_id}`, product_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteProduct = async (product_id: number): Promise<void> => {
    try {
        await apiClient.delete(`/products/${product_id}`)
    } catch (error: unknown) {
        throw error;
    }
}

export const GetProductByBarcode = async (barcode: string): Promise<ProductResponse> => {
    try {
        const response = await apiClient.get(`/products/barcode/${encodeURIComponent(barcode)}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetProductsByCategory = async (category_id: number): Promise<ProductResponse[]> => {
    try {
        const response = await apiClient.get(`/products/category/${category_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
