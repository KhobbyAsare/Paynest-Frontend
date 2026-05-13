import { ProductCategoriesRequest, ProductCategoriesResponse } from "@/interfaces/productCategories";
import apiClient from "@/lib/apiClient";

export const CreateProductCategory = async (category_data: ProductCategoriesRequest): Promise<ProductCategoriesResponse> => {
    try {
        const response = await apiClient.post(`/categories/`, category_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const GetProductCategories = async (): Promise<ProductCategoriesResponse[]> => {
    try {
        const response = await apiClient.get(`/categories/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const UpdateProductCategory = async (category_id: number, category_data: ProductCategoriesRequest): Promise<ProductCategoriesResponse> => {
    try {
        const response = await apiClient.put(`/categories/${category_id}`, category_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const DeleteProductCategory = async (category_id: number) => {
    try {
        const response = await apiClient.delete(`/categories/${category_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
