import { UserResponse } from "@/interfaces/loginInterface"
import { getAPIHeaders } from "@/lib/getToken"
import axios from "axios";


export const getAllUsers = async (): Promise<UserResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/user/all`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: any) {
        throw error;
    }
}