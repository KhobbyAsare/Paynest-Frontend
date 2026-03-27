import { AuditLogResponse } from "@/interfaces/auditLog";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const getAllAuditLogs = async (
    organization_id?: number,
    user_id?: number,
    action?: string,
    entity_type?: string,
    entity_id?: string,
    limit = 100,
    offset = 0
): Promise<{ items: AuditLogResponse[]; total: number }> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/audit-logs/`, {
            headers: getAPIHeaders(),
            params: { organization_id, user_id, action, entity_type, entity_id, limit, offset }
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getAuditLogById = async (audit_log_id: number): Promise<AuditLogResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/audit-logs/${audit_log_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}