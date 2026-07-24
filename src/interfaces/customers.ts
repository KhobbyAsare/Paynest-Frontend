/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CreateCustomerRequest {
    customer_code: string,
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    date_of_birth: string,
    gender: string,
    address: string,
    city: string,
    state: string,
    country: string,
    postal_code: string,
    loyalty_points: number,
    loyalty_tier: string,
    preferred_payment_method: string,
    communication_preferences: {
        additionalProp1: any
    },
    notes: string,
    is_active: boolean
}


export interface CustomerResponse {
    customer_code: string,
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    date_of_birth: string,
    gender: string,
    address: string,
    city: string,
    state: string,
    country: string,
    postal_code: string,
    loyalty_points: number,
    loyalty_tier: string,
    preferred_payment_method: string,
    communication_preferences: {
        additionalProp1: any
    },
    notes: string,
    is_active: boolean,
    id: number,
    organization_id: number,
    created_at: string,
    updated_at: string
}


