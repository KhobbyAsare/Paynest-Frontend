import { StockMovementResponse, StockMovementSummary } from "@/interfaces/StockMovements";
import apiClient from "@/lib/apiClient";


export const GetStockMovement = async (
    skip = 0,
    limit = 50
): Promise<{ items: StockMovementResponse[]; total: number }> => {
    try {
        const response = await apiClient.get(`/stock-movements/`, {
            params: { skip, limit },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetStockMovementSummary = async (): Promise<StockMovementSummary> => {
    try {
        const response = await apiClient.get(`/stock-movements/summary`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
