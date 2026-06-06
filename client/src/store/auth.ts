import * as SecureStore from 'expo-secure-store';
import { CurrencyCode } from '../constants/currency';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mind-wallet-mobile.onrender.com/api';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    has_pin?: boolean;
    currency?: CurrencyCode;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
}

const ACCESS_KEY = 'mw_access_token';
const REFRESH_KEY = 'mw_refresh_token';

let _userName = '';
let _authenticated = false;
let _needsPin = false;
let _needsPinSetup = false;
let _userCurrency: CurrencyCode = 'TRY';
const _listeners = new Set<(state: { authenticated: boolean; needsPin: boolean; needsPinSetup: boolean }) => void>();
const _currencyListeners = new Set<(currency: CurrencyCode) => void>();

export function getUserCurrency(): CurrencyCode {
    return _userCurrency;
}

export function setUserCurrency(code: CurrencyCode) {
    if (_userCurrency !== code) {
        _userCurrency = code;
        _currencyListeners.forEach(fn => fn(_userCurrency));
    }
}

export function subscribeUserCurrency(listener: (c: CurrencyCode) => void) {
    _currencyListeners.add(listener);
    return () => {
        _currencyListeners.delete(listener);
    };
}

function notifyListeners() {
    _listeners.forEach(fn => fn({
        authenticated: _authenticated,
        needsPin: _needsPin,
        needsPinSetup: _needsPinSetup
    }));
}

export async function authFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
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

export function setUserName(name: string) {
    _userName = name;
}

export function getUserInitials(): string {
    if (!_userName)
        return '?';
    return _userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function setAuthState(authenticated: boolean, needsPin = false, needsPinSetup = false) {
    _authenticated = authenticated;
    _needsPin = needsPin;
    _needsPinSetup = needsPinSetup;
    notifyListeners();
}

export function getAuthState() {
    return {
        authenticated: _authenticated,
        needsPin: _needsPin,
        needsPinSetup: _needsPinSetup
    };
}

export function subscribeAuthState(listener: (state: { authenticated: boolean; needsPin: boolean; needsPinSetup: boolean }) => void) {
    _listeners.add(listener);
    return () => {
        _listeners.delete(listener);
    };
}

export async function login(email: string, password: string): Promise<AuthUser> {
    const data = await authFetch<AuthTokens>(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    await saveTokens(data.access_token, data.refresh_token);
    setUserName(data.user.name);
    if (data.user.currency) setUserCurrency(data.user.currency);
    setAuthState(true, false, !data.user.has_pin);
    return data.user;
}

export async function register(fullname: string, email: string, password: string): Promise<AuthUser> {
    const data = await authFetch<AuthTokens>(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({ fullname, email, password }),
    });
    await saveTokens(data.access_token, data.refresh_token);
    setUserName(data.user.name);
    if (data.user.currency) setUserCurrency(data.user.currency);
    setAuthState(true, false, !data.user.has_pin);
    return data.user;
}

export async function logout(): Promise<void> {
    try {
        await authFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {}
    await clearTokens();
    setUserName('');
    setAuthState(false, false, false);
}

export async function getMe(): Promise<AuthUser> {
    const data = await authFetch<{ user: AuthUser }>(`${BASE_URL}/auth/me`);
    if (data.user.currency) setUserCurrency(data.user.currency);
    return data.user;
}

export async function updateProfile(data: { name?: string; currency?: CurrencyCode }): Promise<AuthUser> {
    const res = await authFetch<{ user: AuthUser }>(`${BASE_URL}/auth/me`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (res.user.name) setUserName(res.user.name);
    if (res.user.currency) setUserCurrency(res.user.currency);
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
    setAuthState(false, false, false);
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

export async function setPin(pin: string): Promise<void> {
    await authFetch(`${BASE_URL}/auth/set-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
    });
    setAuthState(true, false, false);
}

export async function verifyPin(pin: string): Promise<AuthUser> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const data = await authFetch<AuthTokens>(`${BASE_URL}/auth/verify-pin`, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken, pin }),
    });
    await saveTokens(data.access_token, data.refresh_token);
    setUserName(data.user.name);
    if (data.user.currency) setUserCurrency(data.user.currency);
    setAuthState(true, false, false);
    return data.user;
}

export async function changePin(current_pin: string, new_pin: string): Promise<void> {
    await authFetch(`${BASE_URL}/auth/change-pin`, {
        method: 'POST',
        body: JSON.stringify({ current_pin, new_pin }),
    });
}

export async function tryRefreshToken(): Promise<{ authenticated: boolean; needsPinSetup: boolean; needsPin: boolean }> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        return { authenticated: false, needsPinSetup: false, needsPin: false };
    }

    try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
            const data = await refreshRes.json();
            // PIN ekranlarını göstermek için access token'ı kaydetmeyelim, sadece verifyPin anında kaydedilsin.
            // Fakat refresh token geçerli olduğu için user bilgisini alırız.
            const user = data.user as AuthUser;
            setUserName(user.name);
            if (user.currency) setUserCurrency(user.currency);

            if (!user.has_pin) {
                // PIN kurulmamış, önce access_token kaydedip setup'a yönlendiriyoruz
                await saveTokens(data.access_token, data.refresh_token);
                setAuthState(true, false, true);
                return { authenticated: true, needsPinSetup: true, needsPin: false };
            } else {
                // PIN var, doğrulaması gerekiyor
                setAuthState(true, true, false);
                return { authenticated: true, needsPinSetup: false, needsPin: true };
            }
        } else {
            await clearTokens();
            return { authenticated: false, needsPinSetup: false, needsPin: false };
        }
    } catch {
        return { authenticated: false, needsPinSetup: false, needsPin: false };
    }
}
