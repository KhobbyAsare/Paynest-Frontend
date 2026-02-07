import { GeneratedCodeResponse, OnboardingOrganizationAndAdminRequest, OrganizationResponse } from "@/interfaces/organization";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

// Superadmin
export const getAllOrganizations = async (): Promise<OrganizationResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/organization/all/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const onboardOrganizationAndAdmin = async (data: OnboardingOrganizationAndAdminRequest): Promise<OrganizationResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/organization/onboard`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const changeOrganizationPlanType = async (organizationId: number, planType: string): Promise<OrganizationResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/organization/${planType}/${organizationId}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}


export const deleteOrganization = async (organizationId: number): Promise<OrganizationResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.delete(`${url}/organization/${organizationId}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

// Administrator
export const generateInvitationCode = async (organization_id: number): Promise<GeneratedCodeResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/organization/${organization_id}/generate-code`, {}, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

