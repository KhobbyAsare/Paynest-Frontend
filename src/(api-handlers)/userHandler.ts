/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserResponse } from "@/interfaces/loginInterface"
import apiClient from "@/lib/apiClient"


export const getAllUsers = async (): Promise<UserResponse[]> => {
    try {
        const response = await apiClient.get(`/user/all`)
        return response.data.items
    } catch (error: any) {
        throw error;
    }
}

export const getUserData = async (): Promise<UserResponse> => {
    try {
        const response = await apiClient.get(`/user/me`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}


// Administrator
export const getOrganizationUsers = async (): Promise<UserResponse[]> => {
    try {
        const response = await apiClient.get(`/user/users/organization`)
        return response.data.items
    } catch (error: any) {
        throw error;
    }
}

export const getUserByID = async (id: string | number): Promise<UserResponse> => {
    try {
        const response = await apiClient.get(`/user/${id}`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateUserProfile = async (data: { first_name?: string; last_name?: string; phone_number?: string; username?: string }): Promise<UserResponse> => {
    try {
        const response = await apiClient.put(`/user/me`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export interface NotificationPreferences {
    new_order_email: boolean;
    new_order_in_app: boolean;
    low_stock_email: boolean;
    low_stock_in_app: boolean;
    daily_closure_email: boolean;
    daily_closure_in_app: boolean;
    report_ready_email: boolean;
    report_ready_in_app: boolean;
    user_activity_email: boolean;
    user_activity_in_app: boolean;
    system_alerts_email: boolean;
    system_alerts_in_app: boolean;
    updated_at?: string;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
    try {
        const response = await apiClient.get(`/user/me/notification-preferences`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateNotificationPreferences = async (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    try {
        const response = await apiClient.put(`/user/me/notification-preferences`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const changePassword = async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post(`/user/me/change-password`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}
