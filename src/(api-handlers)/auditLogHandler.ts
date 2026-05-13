import { AuditLogResponse } from "@/interfaces/auditLog";
import apiClient from "@/lib/apiClient";


export const getAllAuditLogs = async (
    organization_id?: number,
    user_id?: number,
    action?: string,
    entity_type?: string,
    entity_id?: string,
    limit = 100,
    offset = 0
): Promise<{ items: AuditLogResponse[]; total: number }> => {
    try {
        const response = await apiClient.get(`/audit-logs/`, {
            params: { organization_id, user_id, action, entity_type, entity_id, limit, offset }
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getAuditLogById = async (audit_log_id: number): Promise<AuditLogResponse> => {
    try {
        const response = await apiClient.get(`/audit-logs/${audit_log_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
