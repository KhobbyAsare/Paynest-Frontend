export type ReportType = "daily_sales" | "monthly_financial" | "inventory" | "employee_performance" | "customer_analytics"

export type ReportStatus = "pending" | "approved" | "rejected" | "processing" | "completed" | "failed"

export type ReportFileFormat = "pdf" | "excel" | "csv" | "json"

export interface ReportRequest {
    report_type: ReportType,
    report_name: string,
    report_period: string,
    parameters: {
        shop_id: number,
        include_tax: boolean,
        payment_method: string
    },
    file_format: ReportFileFormat,
    period_start: string,
    period_end: string,
    organization_id: number
}

export interface UpdateReportRequest {
    status: ReportStatus,
    file_url: string,
    file_size: number,
    generated_at: string,
    expires_at: string,
    approved_by: number,
    approved_at: string,
    rejection_reason: string
}

export interface ReportResponse {
    report_type: ReportType,
    report_name: string,
    report_period: string,
    parameters: {
        shop_id: number,
        include_tax: boolean,
        payment_method: string
    },
    file_format: ReportFileFormat,
    period_start: string,
    period_end: string,
    id: number,
    organization_id: number,
    status: ReportStatus,
    file_url: string,
    file_path: string,
    file_size: number,
    generated_by: number,
    created_at: string,
    generated_at: string,
    expires_at: string,
    approved_by: number,
    approved_at: string,
    rejection_reason: string
}

export interface ApproveReportRequest {
    approved: boolean,
    rejection_reason: string,
    comments: string
}
