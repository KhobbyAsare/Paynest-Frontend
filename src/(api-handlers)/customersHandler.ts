import { CreateCustomerRequest, CustomerResponse } from "@/interfaces/customers";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const CreateCustomer = async (inventory_data: CreateCustomerRequest): Promise<CustomerResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/customers/`, inventory_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllCustomers = async (shopId?: number): Promise<CustomerResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/customers/`, {
            params: { shop_id: shopId },
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetCustomerByID = async (id: number): Promise<CustomerResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/customers/${id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateCustomer = async (id: number, inventory_data: CreateCustomerRequest): Promise<CustomerResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/customers/${id}/`, inventory_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteCustomer = async (id: number): Promise<CustomerResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.delete(`${url}/customers/${id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
