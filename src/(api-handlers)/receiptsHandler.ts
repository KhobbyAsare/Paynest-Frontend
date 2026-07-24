import axios from "axios";
import apiClient from "@/lib/apiClient";
import {
    EmailReceiptRequest,
    EmailReceiptResponse,
    ReceiptConfigResponse,
    ReceiptFormat,
    UpdateReceiptConfigRequest,
    UploadReceiptLogoResponse,
} from "@/interfaces/receipts";

export const GetReceiptConfig = async (): Promise<ReceiptConfigResponse> => {
    try {
        const response = await apiClient.get(`/receipts/config`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateReceiptConfig = async (data: UpdateReceiptConfigRequest): Promise<ReceiptConfigResponse> => {
    try {
        const response = await apiClient.put(`/receipts/config`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UploadReceiptLogo = async (file: File): Promise<UploadReceiptLogoResponse> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/receipts/config/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetReceiptPdfUrl = async (orderId: number, format: ReceiptFormat): Promise<string> => {
    try {
        const response = await apiClient.get(`/receipts/order/${orderId}/download`, {
            params: { format },
            responseType: 'blob',
        })
        return URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    } catch (error: unknown) {
        // Error bodies come back as a Blob (not JSON) when responseType is 'blob' —
        // rehydrate it so callers reading error.response.data.detail still work.
        if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
            try {
                const text = await error.response.data.text();
                error.response.data = JSON.parse(text);
            } catch {
                // leave as-is if it wasn't JSON
            }
        }
        throw error;
    }
}

export const EmailReceipt = async (orderId: number, data: EmailReceiptRequest): Promise<EmailReceiptResponse> => {
    try {
        const response = await apiClient.post(`/receipts/order/${orderId}/email`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
