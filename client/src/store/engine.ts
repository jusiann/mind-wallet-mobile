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

export async function analyzeEngine(params: AnalyzeParams): Promise<EngineResponse> {
    const res = await apiFetch<{ success: boolean; data: EngineResponse }>('/engine/analyze', {
        method: 'POST',
        body: JSON.stringify(params),
    });
    return res.data;
}
