import { FinanceOverviewResponse } from "@/interfaces/finance";
import apiClient from "@/lib/apiClient";

export const GetFinanceOverview = async (
    shop_id?: number,
    start_date?: string,
    end_date?: string
): Promise<FinanceOverviewResponse> => {
    try {
        const response = await apiClient.get(`/finance/overview`, {
            params: {
                shop_id,
                start_date,
                end_date
            }
        });
        return response.data;
    } catch (error: unknown) {
        throw error;
    }
};
