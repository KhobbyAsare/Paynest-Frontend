/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserResponse } from "@/interfaces/loginInterface"
import apiClient from "@/lib/apiClient"


// The endpoint is paginated (default page size well under most users counts), so page through
// it until every item has been collected — dedupe by id in case skip/limit end up ignored.
export const getAllUsers = async (): Promise<UserResponse[]> => {
    try {
        const limit = 100;
        const byId = new Map<number, UserResponse>();
        let skip = 0;
        for (let page = 0; page < 50; page++) {
            const response = await apiClient.get(`/user/all`, { params: { skip, limit } })
            const items: UserResponse[] = response.data.items;
            const total: number = response.data.total;
            items.forEach(user => byId.set(user.id, user));
            skip += items.length;
            if (items.length === 0 || byId.size >= total) break;
        }
        return Array.from(byId.values());
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


// Administrator (organization_id required for superadmin, ignored/must match own org otherwise)
export const getOrganizationUsers = async (organizationId?: number, skip = 0): Promise<UserResponse[]> => {
    try {
        const response = await apiClient.get(`/user/users/organization`, {
            params: { organization_id: organizationId, skip },
        })
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
    payslip_ready_email: boolean;
    payslip_ready_in_app: boolean;
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

export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadProfilePicture = async (file: File): Promise<{ profile_pic: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/user/me/profile-picture`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const removeProfilePicture = async (): Promise<void> => {
    try {
        await apiClient.delete(`/user/me/profile-picture`)
    } catch (error: any) {
        throw error;
    }
}
