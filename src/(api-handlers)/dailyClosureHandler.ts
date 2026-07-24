import { DailyClosureRequest, DailyClosureResponse, SubmitClosureRequest, VerifyClosureRequest } from "@/interfaces/dailyClosure";
import apiClient from "@/lib/apiClient";

export const CreateDailyClosure = async (data: DailyClosureRequest) => {
    try {
        const response = await apiClient.post(`/daily-closures/open`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetCurrentClosure = async (shop_id: number) => {
    try {
        const response = await apiClient.get(`/daily-closures/current/${shop_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetAllClosures = async (shop_id?: number, startDate?: string, endDate?: string) => {
    try {
        const response = await apiClient.get(`/daily-closures/`, {
            params: {
                shop_id: shop_id,
                start_date: startDate,
                end_date: endDate
            },
        })
        const items: DailyClosureResponse[] = response.data.items ?? []
        return items.filter((item) => item?.id != null)
    } catch (error: unknown) {
        throw error;
    }
}

export const SubmitDailyClosure = async (closure_id: number, data: SubmitClosureRequest) => {
    try {
        const response = await apiClient.post(`/daily-closures/${closure_id}/submit`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const VerifyDailyClosure = async (closure_id: number, data: VerifyClosureRequest) => {
    try {
        const response = await apiClient.post(`/daily-closures/${closure_id}/verify`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetClosureDetails = async (closureId: number) => {
    try {
        const response = await apiClient.get(`/daily-closures/${closureId}/details`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
