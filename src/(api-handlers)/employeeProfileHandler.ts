import { EmployeeProfileRequest } from "@/interfaces/employeeProfile";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";


export const createEmployeeProfile = async (employeeProfileRequest: EmployeeProfileRequest) => {
    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL}/employee_profile/`, employeeProfileRequest, {
            headers: getAPIHeaders(),
        })
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateEmployeeProfile = async (userId: number, employeeProfileRequest: any) => {
    try {
        const response = await axios.put(`${process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL}/employee_profile/${userId}`, employeeProfileRequest, {
            headers: getAPIHeaders(),
        })
        return response.data;
    } catch (error) {
        throw error;
    }
}