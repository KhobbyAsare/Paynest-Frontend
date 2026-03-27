import { StockMovementResponse, StockMovementSummary } from "@/interfaces/StockMovements";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const GetStockMovement = async (
    skip = 0,
    limit = 50
): Promise<{ items: StockMovementResponse[]; total: number }> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/stock-movements/`, {
            params: { skip, limit },
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetStockMovementSummary = async (): Promise<StockMovementSummary> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/stock-movements/summary`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
