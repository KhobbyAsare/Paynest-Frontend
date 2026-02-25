import { ProductCategoriesRequest, ProductCategoriesResponse } from "@/interfaces/productCategories";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const CreateProductCategory = async (category_data: ProductCategoriesRequest): Promise<ProductCategoriesResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/categories/`, category_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const GetProductCategories = async (): Promise<ProductCategoriesResponse[]> =>{
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/categories/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const UpdateProductCategory = async (category_id:number, category_data: ProductCategoriesRequest): Promise<ProductCategoriesResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/categories/${category_id}`, category_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const DeleteProductCategory = async (category_id:number) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.delete(`${url}/categories/${category_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}