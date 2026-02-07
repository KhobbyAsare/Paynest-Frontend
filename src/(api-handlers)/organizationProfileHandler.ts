import { OrganizationResponse } from "@/interfaces/organization";
import { UpdateOrganizationProfileRequest } from "@/interfaces/organizationProfile";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const getOrganizationProfileByOrgId = async (organization_id: number): Promise<OrganizationResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/organization/${organization_id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const updateOrganizationProfile = async (organization_id: number, data: UpdateOrganizationProfileRequest): Promise<OrganizationResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/organization/${organization_id}/`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}