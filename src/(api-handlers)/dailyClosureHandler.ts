import { DailyClosureRequest, SubmitClosureRequest, VerifyClosureRequest } from "@/interfaces/dailyClosure";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const CreateDailyClosure = async (data: DailyClosureRequest) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/daily-closures/open`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetCurrentClosure = async (shop_id: number) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/daily-closures/current/${shop_id}`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const SubmitDailyClosure = async (closure_id: number, data: SubmitClosureRequest) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/daily-closures/${closure_id}/submit`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const VerifyDailyClosure = async (closure_id: number, data: VerifyClosureRequest) => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/daily-closures/${closure_id}/verify`, data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
