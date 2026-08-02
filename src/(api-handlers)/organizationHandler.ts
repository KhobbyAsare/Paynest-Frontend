import { ChangeOrganizationSubscriptionPlanRequest, GeneratedCodeResponse, OnboardingOrganizationAndAdminRequest, OnboardOrganizationResponse, OrganizationResponse } from "@/interfaces/organization";
import apiClient from "@/lib/apiClient";

// Superadmin
// The endpoint is paginated (default page size well under most orgs counts), so page through
// it until every item has been collected — dedupe by id in case skip/limit end up ignored.
export const getAllOrganizations = async (): Promise<OrganizationResponse[]> => {
    try {
        const limit = 100;
        const byId = new Map<number, OrganizationResponse>();
        let skip = 0;
        for (let page = 0; page < 50; page++) {
            const response = await apiClient.get(`/organization/all/`, { params: { skip, limit } })
            const items: OrganizationResponse[] = response.data.items;
            const total: number = response.data.total;
            items.forEach(org => byId.set(org.id, org));
            skip += items.length;
            if (items.length === 0 || byId.size >= total) break;
        }
        return Array.from(byId.values());
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
