import { apiFetch } from '../constants/api';

export interface Goal {
    id: number;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
    created_at: string;
    progress_pct: number;
}

export async function getGoals(status?: string): Promise<{ success: boolean; data?: Goal[]; message?: string }> {
    try {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        const res = await apiFetch<{ success: boolean; goals: Goal[]; total: number }>(`/goals${query}`);
        return { success: true, data: res.goals };
    } catch (error: any) {
        return { success: false, message: error.message || 'Bir hata oluştu.' };
    }
}

export async function createGoal(body: { title: string; target_amount: number; deadline: string }): Promise<{ success: boolean; data?: Goal; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; goal: Goal }>('/goals', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return { success: true, data: res.goal };
    } catch (error: any) {
        return { success: false, message: error.message || 'Bir hata oluştu.' };
    }
}

export async function updateGoal(id: number, body: Partial<{ title: string; target_amount: number; deadline: string; status: string }>): Promise<{ success: boolean; data?: Goal; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; goal: Goal }>(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        return { success: true, data: res.goal };
    } catch (error: any) {
        return { success: false, message: error.message || 'Bir hata oluştu.' };
    }
}

export async function deleteGoalById(id: number): Promise<{ success: boolean; message?: string }> {
    try {
        await apiFetch<{ success: boolean }>(`/goals/${id}`, { method: 'DELETE' });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Bir hata oluştu.' };
    }
}
