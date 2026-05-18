import apiClient from "@/lib/apiClient";
import {
    SuperAdminDashboardResponse,
    SystemHealth,
    TopProduct,
    UserWithoutProfile,
} from "@/interfaces/superadminDashboard";

export const getSuperAdminDashboard = async (
    start_date?: string,
    end_date?: string,
): Promise<SuperAdminDashboardResponse> => {
    const response = await apiClient.get(`/superadmin/dashboard`, {
        params: { start_date, end_date },
    });
    return response.data;
};

export const getSuperAdminSystemHealth = async (): Promise<SystemHealth> => {
    const response = await apiClient.get(`/superadmin/system-health`);
    return response.data;
};

export const getSuperAdminTopProducts = async (
    start_date?: string,
    end_date?: string,
    limit = 10,
): Promise<TopProduct[]> => {
    const response = await apiClient.get(`/superadmin/top-products`, {
        params: { start_date, end_date, limit },
    });
    return response.data;
};

export const getSuperAdminUsersWithoutProfile = async (): Promise<UserWithoutProfile[]> => {
    const response = await apiClient.get(`/superadmin/users-without-profile`);
    return response.data;
};
