import * as SecureStore from 'expo-secure-store';

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

type AuthListener = (authenticated: boolean) => void;

let _authenticated = false;
const _listeners = new Set<AuthListener>();

export function setAuthState(authenticated: boolean) {
    _authenticated = authenticated;
    _listeners.forEach(fn => fn(authenticated));
}

export function getAuthState() {
    return _authenticated;
}

export function subscribeAuthState(listener: AuthListener) {
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
}
