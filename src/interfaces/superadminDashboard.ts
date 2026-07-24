export interface PlatformSummary {
    total_organizations: number;
    active_organizations: number;
    total_users: number;
    active_users: number;
    total_shops: number;
    total_orders: number;
    total_revenue: number;
    new_orgs_in_period: number;
    new_users_in_period: number;
}

export interface PlanDistribution {
    plan: string;
    count: number;
}

export interface OrgMetrics {
    org_id: number;
    org_name: string;
    plan_type: string;
    is_active: boolean;
    total_users: number;
    total_shops: number;
    total_orders: number;
    total_revenue: number;
    joined_at: string;
}

export interface PlatformTrend {
    date: string;
    revenue: number;
    orders: number;
}

export interface SuperAdminDashboardResponse {
    summary: PlatformSummary;
    plan_distribution: PlanDistribution[];
    org_metrics: OrgMetrics[];
    platform_trends: PlatformTrend[];
    period_start: string;
    period_end: string;
}

export interface SystemHealth {
    api_status: 'healthy' | 'degraded' | 'down';
    db_status: 'healthy' | 'degraded' | 'down';
    avg_response_time_ms: number;
    uptime_percent: number;
    total_requests_today: number;
    error_rate_percent: number;
    last_checked: string;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    category: string;
    total_quantity_sold: number;
    total_revenue: number;
    order_count: number;
}

export interface UserWithoutProfile {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    org_name: string;
    org_id: number;
    registered_at: string;
}
