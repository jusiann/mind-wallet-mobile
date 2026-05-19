import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'mw_onboarding_completed';

let _onboardingCompleted = false;
const _listeners = new Set<(completed: boolean) => void>();

export async function loadOnboardingState(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    _onboardingCompleted = value === 'true';
    return _onboardingCompleted;
}

export async function completeOnboarding(): Promise<void> {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    _onboardingCompleted = true;
    _listeners.forEach(fn => fn(true));
}

export function getOnboardingCompleted(): boolean {
    return _onboardingCompleted;
}

export function subscribeOnboarding(listener: (completed: boolean) => void) {
    _listeners.add(listener);
    return () => {
        _listeners.delete(listener);
    };
}
