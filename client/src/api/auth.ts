import { apiFetch } from './client';

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export function signup(data: { fullname: string; email: string; password: string }) {
    return apiFetch<AuthTokens & { user: User }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function signin(data: { email: string; password: string }) {
    return apiFetch<AuthTokens & { user: User }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function forgotPassword(data: { email: string }) {
    return apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function checkResetCode(data: { email: string; reset_code: string }) {
    return apiFetch<{ message: string; temporary_token: string; email: string }>('/auth/check-reset-code', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function resetPassword(data: { password: string; temporary_token: string }) {
    return apiFetch<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function getMe() {
    return apiFetch<{ user: User }>('/auth/me');
}

export function logout() {
    return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
}
