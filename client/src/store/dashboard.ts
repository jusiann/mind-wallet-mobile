import { apiFetch } from '../constants/api';

export interface DashboardGoal {
    id: number;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    progress_pct: number;
}

export interface DashboardTransaction {
    id: number;
    description: string;
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    category_name: string;
    transaction_timestamp: string;
}

export interface DashboardData {
    total_balance: number;
    monthly_income: number;
    active_goals: DashboardGoal[];
    recent_transactions: DashboardTransaction[];
    monthly_stats: {
        total_income: number;
        total_expense: number;
        net: number;
        expense_vs_last_month_pct: number | null;
    };
    ai_insight: {
        label: string;
        message: string;
    };
}

export async function getDashboard(): Promise<{ success: boolean; data?: DashboardData; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; data: DashboardData }>('/dashboard');
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
