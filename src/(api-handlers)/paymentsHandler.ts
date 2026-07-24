import apiClient from "@/lib/apiClient";
import { PaymentRequest, PaymentResponse, PaymentUpdateRequest } from "@/interfaces/payments";

export const CreatePayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
    try {
        const response = await apiClient.post(`/payments/`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetPaymentsByOrderId = async (order_id: number): Promise<PaymentResponse[]> => {
    try {
        const response = await apiClient.get(`/payments/order/${order_id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllPayments = async (
    shopId?: number,
    skip = 0,
    limit = 50
): Promise<{ items: PaymentResponse[]; total: number }> => {
    try {
        const response = await apiClient.get(`/payments/`, {
            params: { shop_id: shopId, skip, limit },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdatePayment = async (id: number, data: PaymentUpdateRequest): Promise<PaymentResponse> => {
    try {
        const response = await apiClient.put(`/payments/${id}/`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeletePayment = async (id: number): Promise<PaymentResponse> => {
    try {
        const response = await apiClient.delete(`/payments/${id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
