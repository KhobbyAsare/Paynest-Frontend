import { Roles } from "./enums";

export interface EmployeeProfileRequest {
    user_id: number,
    organization_id: number,
    shop_id: number,
    employee_code: string,
    department: string,
    job_title: string,
    hire_date: string,
    employment_type: string,
    employment_status: string,
    termination_date: string,
    work_email: string,
    work_phone: string,
    can_create_shop: boolean,
    can_manage_users: boolean,
    can_view_reports: boolean,
    can_manage_inventory: boolean,
    role: Roles
}