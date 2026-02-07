export interface AuditLogResponse {
    organization_id: number,
    user_id: number,
    user_email: string,
    user_role: string,
    action: string,
    entity_type: string,
    entity_id: string,
    old_values: {
        additionalProp1: {}
    },
    new_values: {
        additionalProp1: {}
    },
    changes: {
        additionalProp1: {}
    },
    ip_address: string,
    user_agent: string,
    location: string,
    status: string,
    error_message: string,
    id: number,
    created_at: string
}