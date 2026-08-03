export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Shift {
    id: number;
    organization_id: number;
    shop_id: number;
    employee_profile_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    scheduled_hours: number;
    status: ShiftStatus;
    notes: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface ShiftCreate {
    shop_id: number;
    employee_profile_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    notes?: string;
}

export interface ShiftUpdate {
    shop_id?: number;
    employee_profile_id?: number;
    shift_date?: string;
    start_time?: string;
    end_time?: string;
    status?: ShiftStatus;
    notes?: string;
}

export interface ShiftListResponse {
    items: Shift[];
    total: number;
    skip: number;
    limit: number;
}

export interface ShiftFilters {
    shop_id?: number;
    employee_profile_id?: number;
    status?: ShiftStatus;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}

export interface OvertimeRule {
    id: number;
    organization_id: number;
    daily_threshold_hours: number;
    weekly_threshold_hours: number;
    multiplier: number;
    is_active: boolean;
}

export interface OvertimeRuleUpdate {
    daily_threshold_hours?: number;
    weekly_threshold_hours?: number;
    multiplier?: number;
    is_active?: boolean;
}

export interface OvertimeSummary {
    employee_profile_id: number;
    start_date: string;
    end_date: string;
    regular_hours: number;
    overtime_hours: number;
    total_hours: number;
}
