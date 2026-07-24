import { WalkInsRequest, OrderWalkInsResponse, OrderRequest, OrderStatus, SoldItemsReportResponse, ConfirmPaymentRequest } from "@/interfaces/orders_walkins";
import apiClient from "@/lib/apiClient";

export const CreateWalkIns = async (product_data: WalkInsRequest | OrderRequest): Promise<OrderWalkInsResponse> => {
    try {
        const response = await apiClient.post(`/orders/`, product_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetWalkinOrdersList = async (
    shopId?: number,
    skip = 0,
    limit = 50
): Promise<{ items: OrderWalkInsResponse[]; total: number }> => {
    try {
        const response = await apiClient.get(`/orders/`, {
            params: { shop_id: shopId, skip, limit },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const GetWalkinOrderById = async (id: number): Promise<OrderWalkInsResponse> => {
    try {
        const response = await apiClient.get(`/orders/${id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const CloseOrder = async (id: number): Promise<OrderWalkInsResponse> => {
    try {
        const response = await apiClient.patch(`/orders/${id}/close/`, {})
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}


export const UpdateOrderStatus = async (id: number, status_name: OrderStatus): Promise<OrderWalkInsResponse> => {
    try {
        const response = await apiClient.put(`/orders/${id}/status/${status_name}`, {})
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const ConfirmOrderPayment = async (orderId: number, data: ConfirmPaymentRequest): Promise<OrderWalkInsResponse> => {
    try {
        const response = await apiClient.post(`/orders/${orderId}/confirm-payment`, data);
        return response.data;
    } catch (error: unknown) {
        throw error;
    }
};

export const GetSoldItemsReport = async (date?: string, page: number = 1, size: number = 10, shopId?: number): Promise<SoldItemsReportResponse> => {
    try {
        const response = await apiClient.get(`/orders/sold-items/report`, {
            params: {
                report_date: date,
                page,
                size,
                shop_id: shopId
            },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
