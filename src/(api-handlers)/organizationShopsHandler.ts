import { OrganizationShopRequest, OrganizationShopResponse } from "@/interfaces/organizationShops";
import apiClient from "@/lib/apiClient";

export const createOrganizationShop = async (organizationShopRequest: OrganizationShopRequest): Promise<OrganizationShopResponse> => {
    try {
        const response = await apiClient.post(`/shops/`, organizationShopRequest)
        return response.data
    } catch (error: any) {
        throw error;
    }
}

export const getOrganizationShops = async (): Promise<OrganizationShopResponse[]> => {
    try {
        const response = await apiClient.get(`/shops/`)
        return response.data
    } catch (error: any) {
        throw error;
    }
}
