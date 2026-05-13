import { ApproveReportRequest, ReportRequest, ReportResponse, UpdateReportRequest } from "@/interfaces/report";
import apiClient from "@/lib/apiClient";

export interface ReportPreviewData {
    title: string;
    period: string;
    headers: string[];
    rows: (string | number)[][];
    summary: Record<string, string | number>;
}

export const createReport = async (report_data: ReportRequest): Promise<ReportResponse> => {
    try {
        const response = await apiClient.post(`/reports/`, report_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getAllReports = async (): Promise<ReportResponse[]> => {
    try {
        const response = await apiClient.get(`/reports/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getMyResports = async (): Promise<ReportResponse[]> => {
    try {
        const response = await apiClient.get(`/reports/my-reports`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getReportByID = async (report_id: number): Promise<ReportResponse> => {
    try {
        const response = await apiClient.get(`/reports/${report_id}/`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const updateReport = async (report_id: number, report_data: UpdateReportRequest): Promise<ReportResponse> => {
    try {
        const response = await apiClient.put(`/reports/${report_id}/`, report_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getPendingReports = async (): Promise<ReportResponse[]> => {
    try {
        const response = await apiClient.get(`/reports/pending`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getApprovedReports = async (report_id: number, report_data: ApproveReportRequest): Promise<ReportResponse> => {
    try {
        const response = await apiClient.patch(`/reports/${report_id}/approve`, report_data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const getReportPreview = async (report_id: number): Promise<ReportPreviewData> => {
    try {
        const response = await apiClient.get(`/reports/${report_id}/preview`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const downloadReport = async (report_id: number, fileName: string): Promise<void> => {
    try {
        const response = await apiClient.get(`/reports/${report_id}/download`, {
            responseType: 'blob'
        });

        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error: unknown) {
        throw error;
    }
}
