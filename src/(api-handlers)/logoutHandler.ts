import { LogoutInterface } from "@/interfaces/logout";
import axios from "axios";

export const LogoutHandler = async (req: LogoutInterface) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/auth/logout`, req);
        return response.data;
    } catch (error: any) {
        throw error;
    }
}