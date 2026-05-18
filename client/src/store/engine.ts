import { apiFetch } from '../constants/api';

export interface EngineButton {
    id: string;
    label: string;
    payload: Record<string, unknown>;
}

export interface EngineResponse {
    message: string;
    buttons: EngineButton[] | null;
    classification: string | null;
    label: string | null;
    detected_savings: number | null;
    wasteful_categories: string[] | null;
    optimized_route: { goalId: number; amount: number } | null;
    warning: string | null;
}

interface AnalyzeParams {
    input?: string;
    history: { role: 'user' | 'model'; content: string }[];
    buttonPayload?: Record<string, unknown>;
}

let _pending: string | null = null;

export const pendingMessage = {
    set: (msg: string) => {
        _pending = msg;
    },
    take: () => {
        const m = _pending;
        _pending = null;
        return m;
    },
};

export async function analyzeEngine(params: AnalyzeParams): Promise<{ success: boolean; data?: EngineResponse; message?: string }> {
    try {
        const res = await apiFetch<{ success: boolean; data: EngineResponse }>('/engine/analyze', {
            method: 'POST',
            body: JSON.stringify(params),
        });
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
