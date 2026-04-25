import axios from "axios";
import { RegisterInterface } from "../interfaces/registerInterface";

const BASE_URL = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;

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