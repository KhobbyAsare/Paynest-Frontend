import apiClient from "@/lib/apiClient";
import {
    CreateExpenseCategoryRequest,
    CreateExpenseRequest,
    ExpenseCategoryResponse,
    ExpenseDecisionRequest,
    ExpenseResponse,
    ExpenseStatus,
    ExpensesListResponse,
    UpdateExpenseCategoryRequest,
    UpdateExpenseRequest,
    UploadExpenseReceiptResponse,
} from "@/interfaces/expenses";

export const GetExpenseCategories = async (shop_id?: number): Promise<ExpenseCategoryResponse[]> => {
    try {
        const response = await apiClient.get(`/expenses/categories`, { params: { shop_id } })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const CreateExpenseCategory = async (data: CreateExpenseCategoryRequest): Promise<ExpenseCategoryResponse> => {
    try {
        const response = await apiClient.post(`/expenses/categories`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateExpenseCategory = async (id: number, data: UpdateExpenseCategoryRequest): Promise<ExpenseCategoryResponse> => {
    try {
        const response = await apiClient.put(`/expenses/categories/${id}`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteExpenseCategory = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/expenses/categories/${id}`)
    } catch (error: unknown) {
        throw error;
    }
}

export const UploadExpenseReceipt = async (file: File): Promise<UploadExpenseReceiptResponse> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/expenses/upload-receipt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const CreateExpense = async (data: CreateExpenseRequest): Promise<ExpenseResponse> => {
    try {
        const response = await apiClient.post(`/expenses/`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetExpenses = async (params: {
    status?: ExpenseStatus;
    shop_id?: number;
    category_id?: number;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
} = {}): Promise<ExpensesListResponse> => {
    try {
        const response = await apiClient.get(`/expenses/`, { params })
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const GetExpenseById = async (expense_id: number): Promise<ExpenseResponse> => {
    try {
        const response = await apiClient.get(`/expenses/${expense_id}`)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const UpdateExpense = async (expense_id: number, data: UpdateExpenseRequest): Promise<ExpenseResponse> => {
    try {
        const response = await apiClient.put(`/expenses/${expense_id}`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}

export const DeleteExpense = async (expense_id: number): Promise<void> => {
    try {
        await apiClient.delete(`/expenses/${expense_id}`)
    } catch (error: unknown) {
        throw error;
    }
}

export const DecideExpense = async (expense_id: number, data: ExpenseDecisionRequest): Promise<ExpenseResponse> => {
    try {
        const response = await apiClient.patch(`/expenses/${expense_id}/approve`, data)
        return response.data
    } catch (error: unknown) {
        throw error;
    }
}
