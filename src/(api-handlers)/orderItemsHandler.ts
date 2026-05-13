import { OrderItemRequest, OrderItemResponse, UpdateOrderItemRequest } from "@/interfaces/orderItems";
import apiClient from "@/lib/apiClient";


export const CreateOrderItems = async (data: OrderItemRequest, order_id: number): Promise<OrderItemResponse> => {
    try {
        const response = await apiClient.post(`/order-items/?order_id=${order_id}`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetOrderItems = async (order_id: number): Promise<OrderItemResponse[]> => {
    try {
        const response = await apiClient.get(`/order-items/order/${order_id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllOrderItems = async (shopId?: number): Promise<OrderItemResponse[]> => {
    try {
        const response = await apiClient.get(`/order-items/`, {
            params: { shop_id: shopId },
        })
        return response.data.items
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateOrderItems = async (id: number, data: UpdateOrderItemRequest): Promise<OrderItemResponse> => {
    try {
        const response = await apiClient.put(`/order-items/${id}/`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const DeleteOrderItems = async (id: number): Promise<OrderItemResponse> => {
    try {
        const response = await apiClient.delete(`/order-items/${id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
