import axios from "axios";
import { RegisterInterface } from "../interfaces/registerInterface";

export const registrationHandler = async (data: RegisterInterface) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/auth/register`, data);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};