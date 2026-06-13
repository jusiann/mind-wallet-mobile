import {
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { clearTokens, getAccessToken, getAuthState, getMe, setAuthState, setUserName, subscribeAuthState, tryRefreshToken } from '../store/auth';
import { getOnboardingCompleted, loadOnboardingState, subscribeOnboarding } from '../store/onboarding';
import { COLORS } from '../constants/theme';
import { fetchExchangeRates } from '../constants/currency';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function SplashScreenController({ onReady }: { onReady: () => void }) {
    const [loaded, error] = useFonts({
        HankenGrotesk_400Regular,
        HankenGrotesk_500Medium,
        HankenGrotesk_600SemiBold,
        HankenGrotesk_700Bold,
    });

    useEffect(() => {
        if (!loaded && !error) return;

        let cancelled = false;

        (async () => {
            try {
                fetchExchangeRates().catch(() => {});

                const refreshState = await tryRefreshToken();
                if (!refreshState.authenticated) {
                    await clearTokens();
                } else if (!refreshState.needsPin && !refreshState.needsPinSetup) {
                    const token = await getAccessToken();
                    if (token) {
                        const res = await getMe();
                        setUserName(res.name);
                        setAuthState(true, false, !res.has_pin);
                    }
                }
            } catch {
                await clearTokens();
            }

            await loadOnboardingState();

            if (!cancelled) {
                onReady();
                SplashScreen.hideAsync();
            }
        })();

        return () => { cancelled = true; };
    }, [loaded, error]);

    return null;
}

function RootNavigator() {
    const [authState, setAuth] = useState(getAuthState());
    const [onboardingDone, setOnboardingDone] = useState(getOnboardingCompleted());
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => subscribeAuthState(setAuth), []);
    useEffect(() => subscribeOnboarding(setOnboardingDone), []);

    const { authenticated, needsPin, needsPinSetup } = authState;
    const isFullyAuthed = authenticated && !needsPin && !needsPinSetup;

    useEffect(() => {
        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';

        if (!authenticated && !inAuthGroup) {
            // Not logged in → send to login
            router.replace('/(auth)/login');
        } else if (authenticated && needsPinSetup) {
            router.replace('/pin-setup');
        } else if (authenticated && needsPin) {
            router.replace('/pin-entry');
        } else if (isFullyAuthed && !onboardingDone) {
            router.replace('/onboarding');
        } else if (isFullyAuthed && onboardingDone && !inTabsGroup) {
            router.replace('/(tabs)');
        }
    }, [authenticated, needsPin, needsPinSetup, onboardingDone, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="pin-entry" />
            <Stack.Screen name="pin-setup" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="index" />
        </Stack>
    );
}

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);

    if (!isReady)
        return <SplashScreenController onReady={() => setIsReady(true)} />;

    return <RootNavigator />;
}
