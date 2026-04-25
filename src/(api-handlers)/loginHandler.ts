// api-handlers/loginHandler.ts
import axios from "axios";
import { LoginInterface, LoginResponseInterface } from "../interfaces/loginInterface";

// Original handler for JSON data
export const loginHandler = async (data: LoginInterface): Promise<LoginResponseInterface> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/auth/token`, data);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// New handler for FormData
export const loginWithFormData = async (formData: FormData): Promise<LoginResponseInterface> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    const response = await axios.post(`${url}/auth/token`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const forgotPasswordHandler = async (email: string): Promise<{ message: string }> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    const response = await axios.post(`${url}/auth/forgot-password`, { email });
    return response.data;
};

export const resetPasswordHandler = async (token: string, new_password: string): Promise<{ message: string }> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    const response = await axios.post(`${url}/auth/reset-password`, { token, new_password });
    return response.data;
};