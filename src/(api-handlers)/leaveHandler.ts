import {
    LeaveType, LeaveTypeCreate, LeaveTypeUpdate,
    LeaveBalance, LeaveBalanceUpsert,
    LeaveRequest, LeaveRequestCreate, LeaveRequestApproval, LeaveRequestListResponse, LeaveRequestFilters,
} from "@/interfaces/leave"
import apiClient from "@/lib/apiClient"

// ─── Leave types ─────────────────────────────────────────────────────────────
export const getLeaveTypes = async (isActive?: boolean): Promise<LeaveType[]> => {
    try {
        const response = await apiClient.get(`/leave/types`, { params: { is_active: isActive } })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const createLeaveType = async (data: LeaveTypeCreate): Promise<LeaveType> => {
    try {
        const response = await apiClient.post(`/leave/types`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const updateLeaveType = async (id: number, data: LeaveTypeUpdate): Promise<LeaveType> => {
    try {
        const response = await apiClient.put(`/leave/types/${id}`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const deleteLeaveType = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/leave/types/${id}`)
    } catch (error: unknown) {
        throw error;
    }
}

// ─── Leave balances ──────────────────────────────────────────────────────────
export const getLeaveBalances = async (employeeProfileId: number, year?: number): Promise<LeaveBalance[]> => {
    try {
        const response = await apiClient.get(`/leave/balances/${employeeProfileId}`, { params: { year } })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const upsertLeaveBalance = async (
    employeeProfileId: number,
    leaveTypeId: number,
    data: LeaveBalanceUpsert,
): Promise<LeaveBalance> => {
    try {
        const response = await apiClient.put(`/leave/balances/${employeeProfileId}/${leaveTypeId}`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

// ─── Leave requests ──────────────────────────────────────────────────────────
export const getLeaveRequests = async (filters: LeaveRequestFilters = {}): Promise<LeaveRequestListResponse> => {
    try {
        const response = await apiClient.get(`/leave/requests`, { params: filters })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getLeaveRequest = async (id: number): Promise<LeaveRequest> => {
    try {
        const response = await apiClient.get(`/leave/requests/${id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const createLeaveRequest = async (data: LeaveRequestCreate): Promise<LeaveRequest> => {
    try {
        const response = await apiClient.post(`/leave/requests`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const approveLeaveRequest = async (id: number, data: LeaveRequestApproval): Promise<LeaveRequest> => {
    try {
        const response = await apiClient.patch(`/leave/requests/${id}/approve`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const cancelLeaveRequest = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/leave/requests/${id}`)
    } catch (error: unknown) {
        throw error;
    }
}
