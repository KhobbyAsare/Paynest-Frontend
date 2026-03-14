import { OrderItemRequest, OrderItemResponse, UpdateOrderItemRequest } from "@/interfaces/orderItems";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const CreateOrderItems = async (data: OrderItemRequest, order_id: number): Promise<OrderItemResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/order-items/?order_id=${order_id}`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetOrderItems = async (order_id: number): Promise<OrderItemResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/order-items/order/${order_id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllOrderItems = async (shopId?: number): Promise<OrderItemResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/order-items/`, {
            params: { shop_id: shopId },
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateOrderItems = async (id: number, data: UpdateOrderItemRequest): Promise<OrderItemResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/order-items/${id}/`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const DeleteOrderItems = async (id: number): Promise<OrderItemResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.delete(`${url}/order-items/${id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

