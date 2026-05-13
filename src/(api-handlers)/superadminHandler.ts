import apiClient from "@/lib/apiClient";
import { SuperAdminDashboardResponse } from "@/interfaces/superadminDashboard";

export const getSuperAdminDashboard = async (
    start_date?: string,
    end_date?: string,
): Promise<SuperAdminDashboardResponse> => {
    const response = await apiClient.get(`/superadmin/dashboard`, {
        params: { start_date, end_date },
    });
    return response.data;
};
