import { router } from 'expo-router';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens, setAuthState } from '../store/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:3000/api';

export const API_ENDPOINTS = {
    AUTH: {
        SIGN_UP: `${BASE_URL}/auth/signup`,
        SIGN_IN: `${BASE_URL}/auth/signin`,
        REFRESH_TOKEN: `${BASE_URL}/auth/refresh-token`,
        LOGOUT: `${BASE_URL}/auth/logout`,
        ME: `${BASE_URL}/auth/me`,
        UPDATE_PROFILE: `${BASE_URL}/auth/me`,
        CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
        DELETE_ACCOUNT: `${BASE_URL}/auth/delete-account`,
        FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
        CHECK_RESET_CODE: `${BASE_URL}/auth/check-reset-code`,
        RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
    },
    TRANSACTIONS: {
        LIST: `${BASE_URL}/transactions`,
        CREATE: `${BASE_URL}/transactions`,
        CATEGORIES: `${BASE_URL}/transactions/categories`,
        EXPORT: `${BASE_URL}/transactions/export`,
        DETAIL: (id: number) => `${BASE_URL}/transactions/${id}`,
        UPDATE: (id: number) => `${BASE_URL}/transactions/${id}`,
        DELETE: (id: number) => `${BASE_URL}/transactions/${id}`,
    },
    GOALS: {
        LIST: `${BASE_URL}/goals`,
        CREATE: `${BASE_URL}/goals`,
        DETAIL: (id: number) => `${BASE_URL}/goals/${id}`,
        UPDATE: (id: number) => `${BASE_URL}/goals/${id}`,
        DELETE: (id: number) => `${BASE_URL}/goals/${id}`,
    },
    DASHBOARD: `${BASE_URL}/dashboard`,
    ENGINE: {
        ANALYZE: `${BASE_URL}/engine/analyze`,
    },
    PLEDGES: {
        LIST: `${BASE_URL}/pledges`,
        RESOLVE: (id: number) => `${BASE_URL}/pledges/${id}/resolve`,
        CANCEL: (id: number) => `${BASE_URL}/pledges/${id}/cancel`,
    },
};

type FetchOptions = RequestInit & { _retry?: boolean };

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token)
        headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401 && !options._retry) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                await saveTokens(data.access_token, data.refresh_token);
                return apiFetch(path, { ...options, _retry: true });
            }
        }
        await clearTokens();
        setAuthState(false);
        router.replace('/(auth)/login');
        throw new Error('Oturum süresi doldu.');
    }

    const json = await res.json();
    if (!res.ok)
        throw new Error(json.error || json.message || 'Bir hata oluştu.');
    return json as T;
}
