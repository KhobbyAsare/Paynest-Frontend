import { OrganizationShopRequest, OrganizationShopResponse } from "@/interfaces/organizationShops";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const createOrganizationShop = async (organizationShopRequest: OrganizationShopRequest): Promise<OrganizationShopResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/shops/`, organizationShopRequest, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const getOrganizationShops = async (): Promise<OrganizationShopResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/shops/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}
