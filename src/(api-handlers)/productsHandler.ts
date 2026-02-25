import { ProductRequest, ProductResponse } from "@/interfaces/products";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const CreateProduct = async (product_data: ProductRequest): Promise<ProductResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/products/`, product_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const GetProducts = async (): Promise<ProductResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/products/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetProductByID = async (product_id: number): Promise<ProductResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/products/${product_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateProdctDetails = async (product_id: number, product_data: ProductRequest): Promise<ProductResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/products/${product_id}`, product_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteProduct = async (product_id: number): Promise<void> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        await axios.delete(`${url}/products/${product_id}`, {
            headers: getAPIHeaders(),
        })
    } catch (error: unknown) {
        throw error;
    }
}

export const GetProductsByCategory = async (category_id: number): Promise<ProductResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/products/category/${category_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
