import {
    Shift, ShiftCreate, ShiftUpdate, ShiftListResponse, ShiftFilters,
    OvertimeRule, OvertimeRuleUpdate, OvertimeSummary,
} from "@/interfaces/scheduling"
import apiClient from "@/lib/apiClient"

// ─── Shifts ──────────────────────────────────────────────────────────────────
export const getShifts = async (filters: ShiftFilters = {}): Promise<ShiftListResponse> => {
    try {
        const response = await apiClient.get(`/scheduling/shifts`, { params: filters })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getShift = async (id: number): Promise<Shift> => {
    try {
        const response = await apiClient.get(`/scheduling/shifts/${id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const createShift = async (data: ShiftCreate): Promise<Shift> => {
    try {
        const response = await apiClient.post(`/scheduling/shifts`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const updateShift = async (id: number, data: ShiftUpdate): Promise<Shift> => {
    try {
        const response = await apiClient.put(`/scheduling/shifts/${id}`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const deleteShift = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/scheduling/shifts/${id}`)
    } catch (error: unknown) {
        throw error;
    }
}

// ─── Overtime rules ──────────────────────────────────────────────────────────
export const getOvertimeRules = async (): Promise<OvertimeRule> => {
    try {
        const response = await apiClient.get(`/scheduling/overtime-rules`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const updateOvertimeRules = async (data: OvertimeRuleUpdate): Promise<OvertimeRule> => {
    try {
        const response = await apiClient.put(`/scheduling/overtime-rules`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

// ─── Overtime summary ────────────────────────────────────────────────────────
export const getOvertimeSummary = async (
    employeeProfileId: number,
    startDate: string,
    endDate: string,
): Promise<OvertimeSummary> => {
    try {
        const response = await apiClient.get(`/scheduling/overtime-summary`, {
            params: { employee_profile_id: employeeProfileId, start_date: startDate, end_date: endDate },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
