import { apiFetch } from '../constants/api';

export type CategoryBreakdown = {
    category_name: string;
    amount: number;
    percentage: number;
};

export type TopDay = {
    date: string;
    amount: number;
};

export type MonthlyReport = {
    total_income: number;
    total_expense: number;
    net_income: number;
    savings_rate: number;
    comparison: {
        income_change_pct: number;
        expense_change_pct: number;
    };
    category_breakdown: CategoryBreakdown[];
    top_days: TopDay[];
};

export async function getMonthlyReport(month: string): Promise<{ success: boolean; data?: MonthlyReport; message?: string }> {
    try {
        const res = await apiFetch<any>(`/reports/monthly?month=${month}`);
        if (res.success) {
            return { success: true, data: res.data };
        }
        return { success: false, message: res.error || 'Failed to load monthly report.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Network error.' };
    }
}
