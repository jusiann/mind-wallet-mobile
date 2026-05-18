import { apiFetch } from '../constants/api';

export interface Pledge {
    id: number;
    amount: number;
    baseline_month: string;
    baseline_spent: number;
    status: 'PENDING' | 'RESOLVED' | 'CANCELED' | 'EXPIRED';
    created_at: string;
    resolved_at: string | null;
    goal_title: string;
    goal_id: number;
    category_name: string | null;
}

interface PledgeResolveData {
    resolved: boolean;
    message: string;
    goalCurrentAmount?: number;
    goalTargetAmount?: number;
}

export async function fetchPledges(status?: string): Promise<{ success: boolean; data?: Pledge[]; message?: string }> {
    try {
        const query = status ? `?status=${status}` : '';
        const res = await apiFetch<{ success: boolean; data: Pledge[] }>(`/pledges${query}`);
        return {
            success: true,
            data: res.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Bir hata oluştu.',
        };
    }
}

export async function resolvePledge(id: number): Promise<{ success: boolean; data?: PledgeResolveData; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; data: PledgeResolveData }>(`/pledges/${id}/resolve`, { method: 'POST' });
        return {
            success: true,
            data: res.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Bir hata oluştu.',
        };
    }
}

export async function cancelPledge(id: number): Promise<{ success: boolean; message?: string }> {
    try {
        await apiFetch<{ success: boolean }>(`/pledges/${id}/cancel`, { method: 'POST' });
        return {
            success: true,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Bir hata oluştu.',
        };
    }
}
