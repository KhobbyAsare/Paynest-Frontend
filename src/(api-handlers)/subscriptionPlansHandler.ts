import {
    CreateSubscriptionPlanRequest, SubscriptionPlanResponse, UpdateSubscriptionPlanRequest,
} from "@/interfaces/subscriptionPlan";
import apiClient from "@/lib/apiClient";

export const getSubscriptionPlans = async (
    { activeOnly, skip = 0, limit = 50 }: { activeOnly?: boolean; skip?: number; limit?: number } = {}
): Promise<SubscriptionPlanResponse[]> => {
    try {
        const response = await apiClient.get(`/subscription-plans/`, {
            params: { active_only: activeOnly, skip, limit },
        })
        return response.data.items
    } catch (error: any) {
        throw error;
    }
}

export const getSubscriptionPlanById = async (id: number): Promise<SubscriptionPlanResponse> => {
    try {
        const response = await apiClient.get(`/subscription-plans/${id}`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const createSubscriptionPlan = async (data: CreateSubscriptionPlanRequest): Promise<SubscriptionPlanResponse> => {
    try {
        const response = await apiClient.post(`/subscription-plans/`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateSubscriptionPlan = async (id: number, data: UpdateSubscriptionPlanRequest): Promise<SubscriptionPlanResponse> => {
    try {
        const response = await apiClient.put(`/subscription-plans/${id}`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const deleteSubscriptionPlan = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/subscription-plans/${id}`)
    } catch (error: any) {
        throw error;
    }
}
