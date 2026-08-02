import { router } from 'expo-router';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens, setAuthState } from '../store/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mind-wallet-mobile.onrender.com/api';

export const API_ENDPOINTS = {
    AUTH: {
        SIGN_UP: '/auth/signup',
        SIGN_IN: '/auth/signin',
        REFRESH_TOKEN: '/auth/refresh-token',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        UPDATE_PROFILE: '/auth/me',
        CHANGE_PASSWORD: '/auth/change-password',
        DELETE_ACCOUNT: '/auth/delete-account',
        FORGOT_PASSWORD: '/auth/forgot-password',
        CHECK_RESET_CODE: '/auth/check-reset-code',
        RESET_PASSWORD: '/auth/reset-password',
        SET_PIN: '/auth/set-pin',
        VERIFY_PIN: '/auth/verify-pin',
        CHANGE_PIN: '/auth/change-pin',
    },
    TRANSACTIONS: {
        LIST: '/transactions',
        CREATE: '/transactions',
        CATEGORIES: '/transactions/categories',
        EXPORT: '/transactions/export',
        DETAIL: (id: number) => `/transactions/${id}`,
        UPDATE: (id: number) => `/transactions/${id}`,
        DELETE: (id: number) => `/transactions/${id}`,
    },
    GOALS: {
        LIST: '/goals',
        CREATE: '/goals',
        DETAIL: (id: number) => `/goals/${id}`,
        UPDATE: (id: number) => `/goals/${id}`,
        DELETE: (id: number) => `/goals/${id}`,
    },
    DASHBOARD: '/dashboard',
    ENGINE: {
        CHAT: '/engine/chat',
        ACTION: '/engine/action',
    },
    PLEDGES: {
        LIST: '/pledges',
        RESOLVE: (id: number) => `/pledges/${id}/resolve`,
        CANCEL: (id: number) => `/pledges/${id}/cancel`,
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

    const targetUrl = path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

    const res = await fetch(targetUrl, { ...options, headers });

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
