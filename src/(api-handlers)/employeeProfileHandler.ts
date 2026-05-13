import { EmployeeProfileRequest } from "@/interfaces/employeeProfile";
import apiClient from "@/lib/apiClient";


export const createEmployeeProfile = async (employeeProfileRequest: EmployeeProfileRequest) => {
    try {
        const response = await apiClient.post(`/employee_profile/`, employeeProfileRequest)
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateEmployeeProfile = async (userId: number, employeeProfileRequest: any) => {
    try {
        const response = await apiClient.put(`/employee_profile/${userId}`, employeeProfileRequest)
        return response.data;
    } catch (error) {
        throw error;
    }
}
