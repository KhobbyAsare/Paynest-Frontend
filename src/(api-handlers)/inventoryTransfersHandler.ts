import apiClient from "@/lib/apiClient";
import {
    CreateTransferRequest,
    TransferDecisionRequest,
    TransferResponse,
    TransferStatus,
    TransfersListResponse,
} from "@/interfaces/inventoryTransfers";

export const CreateTransfer = async (data: CreateTransferRequest): Promise<TransferResponse> => {
    try {
        const response = await apiClient.post(`/inventory-transfers/`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetTransfers = async (params: {
    status?: TransferStatus;
    source_shop_id?: number;
    destination_shop_id?: number;
    skip?: number;
    limit?: number;
} = {}): Promise<TransfersListResponse> => {
    try {
        const response = await apiClient.get(`/inventory-transfers/`, { params })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetTransferById = async (transfer_id: number): Promise<TransferResponse> => {
    try {
        const response = await apiClient.get(`/inventory-transfers/${transfer_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DecideTransfer = async (transfer_id: number, data: TransferDecisionRequest): Promise<TransferResponse> => {
    try {
        const response = await apiClient.patch(`/inventory-transfers/${transfer_id}/approve`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const ShipTransfer = async (transfer_id: number): Promise<TransferResponse> => {
    try {
        const response = await apiClient.post(`/inventory-transfers/${transfer_id}/ship`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const ReceiveTransfer = async (transfer_id: number): Promise<TransferResponse> => {
    try {
        const response = await apiClient.post(`/inventory-transfers/${transfer_id}/receive`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const CancelTransfer = async (transfer_id: number): Promise<void> => {
    try {
        await apiClient.delete(`/inventory-transfers/${transfer_id}`)
    } catch (error: unknown) {
        throw error;
    }
}
