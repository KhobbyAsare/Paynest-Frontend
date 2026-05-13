import { LogoutInterface } from "@/interfaces/logout";
import axios from "axios";
import { API_BASE } from "@/lib/apiClient";

export const LogoutHandler = async (req: LogoutInterface) => {
    const url = API_BASE;
    try {
        const response = await axios.post(`${url}/auth/logout`, req);
        return response.data;
    } catch (error: any) {
        throw error;
    }
}