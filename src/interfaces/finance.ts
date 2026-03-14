export interface FinanceSummary {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    total_orders: number;
    total_tax: number;
    total_discounts: number;
    net_profit: number;
}

export interface ShopFinance {
    shop_id: number;
    shop_name: string;
    revenue: number;
    orders_count: number;
    profit: number;
}

export interface RevenueTrend {
    date: string;
    revenue: number;
    orders: number;
}

export interface FinanceOverviewResponse {
    summary: FinanceSummary;
    shop_breakdown: ShopFinance[];
    trends: RevenueTrend[];
}
