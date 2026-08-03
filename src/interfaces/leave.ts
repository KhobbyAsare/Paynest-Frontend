export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveType {
    id: number;
    organization_id: number;
    name: string;
    description: string | null;
    default_days_per_year: number;
    requires_approval: boolean;
    is_paid: boolean;
    is_active: boolean;
}

export interface LeaveTypeCreate {
    name: string;
    description?: string;
    default_days_per_year?: number;
    requires_approval?: boolean;
    is_paid?: boolean;
    is_active?: boolean;
}

export type LeaveTypeUpdate = Partial<LeaveTypeCreate>;

export interface LeaveBalance {
    id: number;
    organization_id: number;
    employee_profile_id: number;
    leave_type_id: number;
    year: number;
    allocated_days: number;
    used_days: number;
    remaining_days: number;
}

export interface LeaveBalanceUpsert {
    year: number;
    allocated_days: number;
}

export interface LeaveRequest {
    id: number;
    organization_id: number;
    employee_profile_id: number;
    leave_type_id: number;
    shop_id: number | null;
    leave_number: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string | null;
    status: LeaveRequestStatus;
    requested_by: number;
    approved_by: number | null;
    rejection_reason: string | null;
    notes: string | null;
    requested_at: string;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface LeaveRequestCreate {
    employee_profile_id?: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason?: string;
    notes?: string;
}

export interface LeaveRequestApproval {
    approved: boolean;
    rejection_reason?: string;
}

export interface LeaveRequestListResponse {
    items: LeaveRequest[];
    total: number;
    skip: number;
    limit: number;
}

export interface LeaveRequestFilters {
    status?: LeaveRequestStatus;
    employee_profile_id?: number;
    leave_type_id?: number;
    shop_id?: number;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}
