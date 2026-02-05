export interface LoginInterface {
    email?: string;
    username?: string;
    password: string;
}

export interface UserResponse {
    id: number,
    email: string,
    username: string,
    first_name: string,
    last_name: string,
    role: 'superadmin' | 'admin' | 'manager' | 'attendant',
    phone_number: string,
    profile_pic: string,
    is_active: boolean,
    email_verified: boolean,
    last_login: string,
    created_at: string,
    updated_at: string
    employee_profile?: {
        id: number,
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
        created_at: string,
        updated_at: string
    },
}

export interface LoginResponseInterface {
    access_token: string,
    token_type: string,
    user: UserResponse
}
