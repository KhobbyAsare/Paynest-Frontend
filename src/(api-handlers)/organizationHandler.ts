import { ChangeOrganizationSubscriptionPlanRequest, GeneratedCodeResponse, OnboardingOrganizationAndAdminRequest, OnboardOrganizationResponse, OrganizationResponse } from "@/interfaces/organization";
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

export const onboardOrganizationAndAdmin = async (data: OnboardingOrganizationAndAdminRequest): Promise<OnboardOrganizationResponse> => {
    try {
        const response = await apiClient.post(`/organization/`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const changeOrganizationSubscriptionPlan = async (organizationId: number, subscriptionPlanId: number): Promise<OrganizationResponse> => {
    try {
        const data: ChangeOrganizationSubscriptionPlanRequest = { subscription_plan_id: subscriptionPlanId };
        const response = await apiClient.put(`/organization/${organizationId}/subscription-plan`, data)
        return response.data
    } catch (error: any) {
        throw error;
    }
}


export const deleteOrganization = async (organizationId: number): Promise<void> => {
    try {
        await apiClient.delete(`/organization/${organizationId}`)
    } catch (error: any) {
        throw error;
    }
}

export const resendAdminVerification = async (organizationId: number): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post(`/organization/${organizationId}/resend-admin-verification`)
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
