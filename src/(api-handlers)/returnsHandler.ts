import apiClient from "@/lib/apiClient";
import {
    CreateReturnRequest,
    ReturnDecisionRequest,
    ReturnResponse,
    ReturnStatus,
    ReturnsListResponse,
} from "@/interfaces/returns";

export const CreateReturn = async (data: CreateReturnRequest): Promise<ReturnResponse> => {
    try {
        const response = await apiClient.post(`/returns/`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetReturns = async (params: {
    status?: ReturnStatus;
    shop_id?: number;
    order_id?: number;
    skip?: number;
    limit?: number;
} = {}): Promise<ReturnsListResponse> => {
    try {
        const response = await apiClient.get(`/returns/`, { params })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetReturnById = async (return_id: number): Promise<ReturnResponse> => {
    try {
        const response = await apiClient.get(`/returns/${return_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DecideReturn = async (return_id: number, data: ReturnDecisionRequest): Promise<ReturnResponse> => {
    try {
        const response = await apiClient.patch(`/returns/${return_id}/approve`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const CancelReturn = async (return_id: number): Promise<void> => {
    try {
        await apiClient.delete(`/returns/${return_id}`)
    } catch (error: unknown) {
        throw error;
    }
}
