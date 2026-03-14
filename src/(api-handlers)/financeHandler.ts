import { FinanceOverviewResponse } from "@/interfaces/finance";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const GetFinanceOverview = async (
    shop_id?: number,
    start_date?: string,
    end_date?: string
): Promise<FinanceOverviewResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/finance/overview`, {
            headers: getAPIHeaders(),
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
