import { WalkInsRequest, OrderWalkInsResponse, OrderRequest, OrderStatus } from "@/interfaces/orders_walkins";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const CreateWalkIns = async (product_data: WalkInsRequest | OrderRequest): Promise<OrderWalkInsResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/orders/`, product_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetWalkinOrdersList = async (): Promise<OrderWalkInsResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/orders/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const GetWalkinOrderById = async (id: number): Promise<OrderWalkInsResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/orders/${id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const CloseOrder = async (id: number): Promise<OrderWalkInsResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.patch(`${url}/orders/${id}/close/`, {}, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const UpdateOrderStatus = async (id: number, status_name: OrderStatus): Promise<OrderWalkInsResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/orders/${id}/status/${status_name}`, {}, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}