// api-handlers/loginHandler.ts
import axios from "axios";
import { LoginInterface, LoginResponseInterface } from "../interfaces/loginInterface";
import { API_BASE } from "@/lib/apiClient";

// Original handler for JSON data
export const loginHandler = async (data: LoginInterface): Promise<LoginResponseInterface> => {
    const url = API_BASE;
    try {
        const response = await axios.post(`${url}/auth/token`, data);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// New handler for FormData
export const loginWithFormData = async (formData: FormData): Promise<LoginResponseInterface> => {
    const url = API_BASE;
    const response = await axios.post(`${url}/auth/token`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const forgotPasswordHandler = async (email: string): Promise<{ message: string }> => {
    const url = API_BASE;
    const response = await axios.post(`${url}/auth/forgot-password`, { email });
    return response.data;
};

export const resetPasswordHandler = async (token: string, new_password: string): Promise<{ message: string }> => {
    const url = API_BASE;
    const response = await axios.post(`${url}/auth/reset-password`, { token, new_password });
    return response.data;
};