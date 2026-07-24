import { CreateCustomerRequest, CustomerResponse } from "@/interfaces/customers";
import apiClient from "@/lib/apiClient";

export const CreateCustomer = async (inventory_data: CreateCustomerRequest): Promise<CustomerResponse> => {
    try {
        const response = await apiClient.post(`/customers/`, inventory_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllCustomers = async (
    shopId?: number,
    skip = 0,
    limit = 20,
): Promise<{ items: CustomerResponse[]; total: number }> => {
    try {
        const response = await apiClient.get(`/customers/`, {
            params: { shop_id: shopId, skip, limit },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetCustomerByID = async (id: number): Promise<CustomerResponse> => {
    try {
        const response = await apiClient.get(`/customers/${id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateCustomer = async (id: number, inventory_data: CreateCustomerRequest): Promise<CustomerResponse> => {
    try {
        const response = await apiClient.put(`/customers/${id}/`, inventory_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteCustomer = async (id: number): Promise<CustomerResponse> => {
    try {
        const response = await apiClient.delete(`/customers/${id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
