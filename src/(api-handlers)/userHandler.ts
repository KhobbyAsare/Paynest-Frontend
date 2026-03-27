/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserResponse } from "@/interfaces/loginInterface"
import { getAPIHeaders } from "@/lib/getToken"
import axios from "axios";


export const getAllUsers = async (): Promise<UserResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/user/all`, {
            headers: getAPIHeaders(),
        })
        return response.data.items
    } catch (error: any) {
        throw error;
    }
}

export const getUserData = async (): Promise<UserResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/user/me`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}


// Administrator
export const getOrganizationUsers = async (): Promise<UserResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/user/users/organization`, {
            headers: getAPIHeaders(),
        })
        return response.data.items
    } catch (error: any) {
        throw error;
    }
}

export const getUserByID = async (id: string | number): Promise<UserResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/user/${id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateUserProfile = async (data: { first_name?: string; last_name?: string; phone_number?: string; username?: string }): Promise<UserResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/user/me`, data, {
            headers: getAPIHeaders(),
        })
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
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/user/me/notification-preferences`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateNotificationPreferences = async (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/user/me/notification-preferences`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const changePassword = async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/user/me/change-password`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}