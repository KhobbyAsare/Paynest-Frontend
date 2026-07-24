import axios from "axios";
import { RegisterInterface } from "../interfaces/registerInterface";
import { API_BASE } from "@/lib/apiClient";

const BASE_URL = API_BASE;

export const registrationHandler = async (data: RegisterInterface) => {
    const response = await axios.post(`${BASE_URL}/auth/register`, data);
    return response.data;
};

export const verifyEmailHandler = async (token: string) => {
    const response = await axios.post(`${BASE_URL}/auth/verify-email`, { token });
    return response.data;
};

export const resendVerificationHandler = async (email: string) => {
    const response = await axios.post(`${BASE_URL}/auth/resend-verification`, { email });
    return response.data;
};