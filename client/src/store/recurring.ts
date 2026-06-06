import { apiFetch } from '../constants/api';

export type RecurringInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type RecurringTransaction = {
    id: number;
    user_id: number;
    category_id: number | null;
    category_name: string | null;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string | null;
    interval: RecurringInterval;
    start_date: string;
    next_run_date: string;
    is_active: boolean;
    created_at: string;
};

export async function fetchRecurringTransactions(): Promise<{ success: boolean; data?: RecurringTransaction[]; message?: string }> {
    try {
        const res = await apiFetch<any>('/recurring');
        if (res.success) {
            return { success: true, data: res.data };
        }
        return { success: false, message: res.error || 'Failed to load recurring transactions.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Network error.' };
    }
}

export async function createRecurringTransaction(data: {
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category_id: number | null;
    description: string | null;
    interval: RecurringInterval;
    start_date: string;
}): Promise<{ success: boolean; data?: RecurringTransaction; message?: string }> {
    try {
        const res = await apiFetch<any>('/recurring', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (res.success) {
            return { success: true, data: res.data };
        }
        return { success: false, message: res.error || 'Failed to create recurring transaction.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Network error.' };
    }
}

export async function toggleRecurringTransaction(id: number, is_active: boolean): Promise<{ success: boolean; data?: RecurringTransaction; message?: string }> {
    try {
        const res = await apiFetch<any>(`/recurring/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active }),
        });
        if (res.success) {
            return { success: true, data: res.data };
        }
        return { success: false, message: res.error || 'Failed to toggle recurring transaction.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Network error.' };
    }
}

export async function deleteRecurringTransaction(id: number): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiFetch<any>(`/recurring/${id}`, {
            method: 'DELETE',
        });
        if (res.success) {
            return { success: true };
        }
        return { success: false, message: res.error || 'Failed to delete recurring transaction.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Network error.' };
    }
}
