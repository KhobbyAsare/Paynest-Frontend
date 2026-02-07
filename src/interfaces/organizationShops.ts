export interface OrganizationShopRequest {
    name: string;
    location: string;
    phone: string;
}

export interface OrganizationShopResponse {
    name: string;
    location: string;
    phone: string;
    id: number;
    organization_id: number;
    created_at: string;
    updated_at: string;
}