export interface OrganizationAdminSummary {
    id: number,
    email: string,
    username: string,
    first_name: string,
    last_name: string,
    phone_number: string,
    email_verified: boolean,
    is_active: boolean,
}

export interface OrganizationResponse {
    id: number,
    name: string,
    description: string,
    address: string,
    email: string,
    phone_number: string,
    currency: string,
    is_active: boolean,
    plan_type: string,
    max_shops: number,
    max_users: number,
    created_at: string,
    updated_at: string,
    admin?: OrganizationAdminSummary | null,
}

export interface OnboardingOrganizationAndAdminRequest {
    name: string,
    description: string,
    address: string,
    email: string,
    phone_number: string,
    currency: string,
    is_active: boolean,
    plan_type: string,
    max_shops: number,
    max_users: number,
    admin_email: string,
    admin_username: string,
    admin_password: string,
    admin_first_name: string,
    admin_last_name: string,
    admin_phone_number: string
}

export interface OnboardOrganizationResponse {
    organization: OrganizationResponse,
    admin_user_id: number,
}

export interface UpdateOrganizationRequest {
    name: string,
    description: string,
    address: string,
    email: string,
    phone_number: string
}

export interface GeneratedCodeResponse {
    code: string,
    organization_id: number,
    is_active: boolean,
    expires_at: string
}