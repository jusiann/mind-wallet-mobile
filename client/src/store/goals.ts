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

export async function getGoals(status?: string): Promise<Goal[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiFetch<{ success: boolean; goals: Goal[]; total: number }>(`/goals${query}`);
    return res.goals;
}

export async function createGoal(body: { title: string; target_amount: number; deadline: string }): Promise<Goal> {
    const res = await apiFetch<{ success: boolean; goal: Goal }>('/goals', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return res.goal;
}

export async function updateGoal(id: number, body: Partial<{ title: string; target_amount: number; deadline: string; status: string }>): Promise<Goal> {
    const res = await apiFetch<{ success: boolean; goal: Goal }>(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return res.goal;
}

export async function deleteGoalById(id: number): Promise<void> {
    await apiFetch<{ success: boolean }>(`/goals/${id}`, { method: 'DELETE' });
}
