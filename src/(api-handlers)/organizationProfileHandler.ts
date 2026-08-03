import { OrganizationResponse } from "@/interfaces/organization";
import { UpdateOrganizationProfileRequest } from "@/interfaces/organizationProfile";
import apiClient from "@/lib/apiClient";


export const getOrganizationProfileByOrgId = async (organization_id: number): Promise<OrganizationResponse> => {
    try {
        const response = await apiClient.get(`/organization/${organization_id}`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateOrganizationProfile = async (organization_id: number, data: UpdateOrganizationProfileRequest): Promise<OrganizationResponse> => {
    try {
        const response = await apiClient.put(`/organization/${organization_id}`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const uploadOrganizationLogo = async (organization_id: number, file: File): Promise<{ logo_url: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/organization/${organization_id}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
