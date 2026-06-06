import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiFetch } from '../constants/api';
import { translateCat } from '../constants/categories';
import { getAccessToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mind-wallet-mobile.onrender.com/api';

export interface Category {
    id: number;
    name: string;
    is_essential: boolean;
    applicable_to: 'EXPENSE' | 'INCOME';
}

export interface Transaction {
    id: number;
    user_id: number;
    category_id: number | null;
    amount: string;
    type: 'EXPENSE' | 'INCOME';
    description: string | null;
    transaction_timestamp: string;
    created_at: string;
}

export interface CategorySpend {
    name: string;
    rawName: string;
    amount: number;
}


export async function fetchTransactions(limit = 100, offset = 0): Promise<{ success: boolean; data?: { transactions: Transaction[]; total: number }; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; transactions: Transaction[]; total: number }>(
            `/transactions?limit=${limit}&offset=${offset}`
        );
        return {
            success: true,
            data: {
                transactions: res.transactions,
                total: res.total,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Bir hata oluştu.',
        };
    }
}

export async function fetchCategories(): Promise<{ success: boolean; data?: { categories: Category[] }; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; categories: Category[] }>('/transactions/categories');
        return {
            success: true,
            data: {
                categories: res.categories,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Bir hata oluştu.',
        };
    }
}

export async function createTransaction(body: {
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    category_id?: number | null;
    description?: string | null;
    transaction_timestamp: string;
}): Promise<{ success: boolean; data?: { transaction: Transaction; warning: string | null }; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; transaction: Transaction; warning: string | null }>(
            '/transactions',
            { method: 'POST', body: JSON.stringify(body) }
        );
        return {
            success: true,
            data: {
                transaction: res.transaction,
                warning: res.warning,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Bir hata oluştu.',
        };
    }
}

export async function deleteTransaction(id: number): Promise<{ success: boolean; message?: string }> {
    try {
        await apiFetch<{ success: boolean }>(`/transactions/${id}`, { method: 'DELETE' });
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

export async function fetchMonthlyExpensesByCategory(): Promise<{
    success: boolean;
    data?: CategorySpend[];
    message?: string;
}> {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [txRes, catRes] = await Promise.all([
            apiFetch<{ success: boolean; transactions: Transaction[]; total: number }>(
                `/transactions?type=EXPENSE&start_date=${encodeURIComponent(start)}&limit=500`,
            ),
            apiFetch<{ success: boolean; categories: Category[] }>('/transactions/categories'),
        ]);
        const catMap = new Map(catRes.categories.map((c: Category) => [c.id, c.name]));
        const totals = new Map<string, number>();
        for (const tx of txRes.transactions) {
            const raw = tx.category_id != null ? (catMap.get(tx.category_id) ?? 'Other') : 'Other';
            totals.set(raw, (totals.get(raw) ?? 0) + parseFloat(String(tx.amount)));
        }
        const data: CategorySpend[] = Array.from(totals.entries())
            .map(([rawName, amount]) => ({ name: translateCat(rawName), rawName, amount }))
            .sort((a, b) => b.amount - a.amount);
        return {
            success: true,
            data,
        };
    } catch (e: any) {
        return {
            success: false,
            message: e.message,
        };
    }
}

export async function exportTransactionsToFile(month?: string): Promise<{ success: boolean; message?: string }> {
    try {
        const token = await getAccessToken();
        const fileUri = `${FileSystem.documentDirectory}mind-wallet-transactions${month ? `-${month}` : ''}.xlsx`;
        
        let url = `${BASE_URL}/transactions/export`;
        if (month) {
            url += `?month=${encodeURIComponent(month)}`;
        }

        const res = await FileSystem.downloadAsync(
            url,
            fileUri,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );

        if (res.status !== 200)
            throw new Error('Dışa aktarma başarısız.');

        const canShare = await Sharing.isAvailableAsync();
        if (!canShare)
            throw new Error('Paylaşım bu cihazda desteklenmiyor.');

        await Sharing.shareAsync(res.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Mind Wallet İşlemleri',
            UTI: 'com.microsoft.excel.xlsx',
        });
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
