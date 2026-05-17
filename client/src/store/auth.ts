import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../constants/base';

const ACCESS_KEY = 'mw_access_token';
const REFRESH_KEY = 'mw_refresh_token';

export async function saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export function getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
}

export function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
}

let _userName = '';
let _authenticated = false;
const _listeners = new Set<(authenticated: boolean) => void>();

export function setUserName(name: string) {
    _userName = name;
}

export function getUserInitials(): string {
    if (!_userName)
        return '?';
    return _userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function setAuthState(authenticated: boolean) {
    _authenticated = authenticated;
    _listeners.forEach(fn => fn(authenticated));
}

export function getAuthState() {
    return _authenticated;
}

export function subscribeAuthState(listener: (authenticated: boolean) => void) {
    _listeners.add(listener);
    return () => {
        _listeners.delete(listener);
    };
}

async function authFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    if (!res.ok)
        throw new Error(json.error || json.message || 'Bir hata oluştu.');
    return json as T;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
    const data = await authFetch<AuthTokens>(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    await saveTokens(data.access_token, data.refresh_token);
    setUserName(data.user.name);
    setAuthState(true);
    return data.user;
}

export async function register(fullname: string, email: string, password: string): Promise<AuthUser> {
    const data = await authFetch<AuthTokens>(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({ fullname, email, password }),
    });
    await saveTokens(data.access_token, data.refresh_token);
    setUserName(data.user.name);
    setAuthState(true);
    return data.user;
}

export async function logout(): Promise<void> {
    try {
        await authFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch { /* server logout hatası olsa da local'i temizle */ }
    await clearTokens();
    setUserName('');
    setAuthState(false);
}

export async function getMe(): Promise<AuthUser> {
    const data = await authFetch<{ user: AuthUser }>(`${BASE_URL}/auth/me`);
    return data.user;
}

export async function updateProfile(data: { name: string }): Promise<AuthUser> {
    const res = await authFetch<{ user: AuthUser }>(`${BASE_URL}/auth/me`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    setUserName(res.user.name);
    return res.user;
}

export async function changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await authFetch(`${BASE_URL}/auth/change-password`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteAccount(data: { password: string }): Promise<void> {
    await authFetch(`${BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        body: JSON.stringify(data),
    });
    await clearTokens();
    setUserName('');
    setAuthState(false);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function checkResetCode(email: string, reset_code: string): Promise<{ message: string; temporary_token: string; email: string }> {
    return authFetch(`${BASE_URL}/auth/check-reset-code`, {
        method: 'POST',
        body: JSON.stringify({ email, reset_code }),
    });
}

export async function resetPassword(password: string, temporary_token: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password, temporary_token }),
    });
}
