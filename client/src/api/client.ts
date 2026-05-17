import { router } from 'expo-router';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens, setAuthState } from '../store/auth';

export const BASE_URL = 'http://192.168.1.12:3000/api';

type FetchOptions = RequestInit & { _retry?: boolean };

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
    const token = await getAccessToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    if (!res.ok) throw new Error(json.error || json.message || 'Bir hata oluştu.');
    return json as T;
}
