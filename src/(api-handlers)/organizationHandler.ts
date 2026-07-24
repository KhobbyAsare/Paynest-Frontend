import { GeneratedCodeResponse, OnboardingOrganizationAndAdminRequest, OrganizationResponse } from "@/interfaces/organization";
import apiClient from "@/lib/apiClient";

// Superadmin
export const getAllOrganizations = async (): Promise<OrganizationResponse[]> => {
    try {
        const response = await apiClient.get(`/organization/all/`)
        return response.data.items
    } catch (error: any) {
        throw error;
    }
}

export const onboardOrganizationAndAdmin = async (data: OnboardingOrganizationAndAdminRequest): Promise<OrganizationResponse> => {
    try {
        const response = await apiClient.post(`/organization/`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const changeOrganizationPlanType = async (organizationId: number, planType: string): Promise<OrganizationResponse> => {
    try {
        const response = await apiClient.put(`/organization/${planType}/${organizationId}`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}


export const deleteOrganization = async (organizationId: number): Promise<OrganizationResponse> => {
    try {
        const response = await apiClient.delete(`/organization/${organizationId}`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

// Administrator
export const generateInvitationCode = async (organization_id: number): Promise<GeneratedCodeResponse> => {
    try {
        const response = await apiClient.post(`/organization/${organization_id}/generate-code`, {})
        return response.data
    } catch (error: any) {
        throw error;
    }
}
