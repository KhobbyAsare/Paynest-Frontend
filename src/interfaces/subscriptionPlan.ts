export interface SubscriptionPlanResponse {
    id: number,
    name: string,
    description: string | null,
    max_shops: number,
    max_users: number,
    duration_days: number | null,
    price: number | null,
    is_active: boolean,
    created_at: string,
    updated_at: string,
}

export interface CreateSubscriptionPlanRequest {
    name: string,
    description?: string,
    max_shops: number,
    max_users: number,
    duration_days: number | null,
    price?: number,
    is_active: boolean,
}

export type UpdateSubscriptionPlanRequest = Partial<CreateSubscriptionPlanRequest>;
