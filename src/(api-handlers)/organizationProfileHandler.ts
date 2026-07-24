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
