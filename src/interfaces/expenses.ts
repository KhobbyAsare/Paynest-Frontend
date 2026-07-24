export type ExpenseStatus = "pending" | "approved" | "rejected";

export interface ExpenseCategoryResponse {
    id: number;
    organization_id: number;
    shop_id: number | null;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface CreateExpenseCategoryRequest {
    shop_id?: number | null;
    name: string;
    description?: string;
}

export interface UpdateExpenseCategoryRequest {
    shop_id?: number | null;
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface ExpenseResponse {
    id: number;
    organization_id: number;
    shop_id: number | null;
    category_id: number;
    expense_number: string;
    vendor_name: string | null;
    amount: number;
    expense_date: string;
    description: string | null;
    receipt_url: string | null;
    status: ExpenseStatus;
    submitted_by: number;
    approved_by: number | null;
    rejection_reason: string | null;
    notes: string | null;
    submitted_at: string;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateExpenseRequest {
    shop_id?: number | null;
    category_id: number;
    vendor_name?: string;
    amount: number;
    expense_date: string;
    description?: string;
    receipt_url?: string;
    notes?: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

export interface ExpenseDecisionRequest {
    approved: boolean;
    rejection_reason?: string;
}

export interface ExpensesListResponse {
    items: ExpenseResponse[];
    total: number;
    skip: number;
    limit: number;
}

export interface UploadExpenseReceiptResponse {
    receipt_url: string;
}
