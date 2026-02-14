import { ApproveReportRequest, ReportRequest, ReportResponse, UpdateReportRequest } from "@/interfaces/report";
import { getAPIHeaders } from "@/lib/getToken";
import axios from "axios";

export const createReport = async (report_data: ReportRequest): Promise<ReportResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.post(`${url}/reports/`, report_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getAllReports = async (): Promise<ReportResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/reports/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getMyResports = async (): Promise<ReportResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/reports/my-reports`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getReportByID = async (report_id: number): Promise<ReportResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/reports/${report_id}/`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const updateReport = async (report_id: number, report_data: UpdateReportRequest): Promise<ReportResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.put(`${url}/reports/${report_id}/`, report_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getPendingReports = async (): Promise<ReportResponse[]> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/reports/pending`, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getApprovedReports = async (report_id: number, report_data: ApproveReportRequest): Promise<ReportResponse> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.patch(`${url}/reports/${report_id}/approve`, report_data, {
            headers: getAPIHeaders(),
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const downloadReport = async (report_id: number, fileName: string): Promise<void> => {
    const url = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;
    try {
        const response = await axios.get(`${url}/reports/${report_id}/download`, {
            headers: getAPIHeaders(),
            responseType: 'blob'
        });

        // Create a local URL for the binary data
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error: unknown) {
        throw error;
    }
}