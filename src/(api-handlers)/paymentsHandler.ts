import axios from "axios";
import { getAPIHeaders } from "@/lib/getToken";
import { PaymentRequest, PaymentResponse, PaymentUpdateRequest } from "@/interfaces/payments";

export const CreatePayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/payments/`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetPaymentsByOrderId = async (order_id: number): Promise<PaymentResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/payments/order/${order_id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllPayments = async (shopId?: number): Promise<PaymentResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/payments/`, {
            params: { shop_id: shopId },
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdatePayment = async (id: number, data: PaymentUpdateRequest): Promise<PaymentResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/payments/${id}/`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeletePayment = async (id: number): Promise<PaymentResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.delete(`${url}/payments/${id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
