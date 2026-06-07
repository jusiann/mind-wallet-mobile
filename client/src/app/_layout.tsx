import {
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { clearTokens, getAccessToken, getAuthState, getMe, setAuthState, setUserName, subscribeAuthState, tryRefreshToken } from '../store/auth';
import { getOnboardingCompleted, loadOnboardingState, subscribeOnboarding } from '../store/onboarding';
import { COLORS } from '../constants/theme';
import { fetchExchangeRates } from '../constants/currency';

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
        (async () => {
            try {
                // Fetch live exchange rates
                fetchExchangeRates().catch(err => console.error('Error fetching exchange rates:', err));
                
                const refreshState = await tryRefreshToken();
                if (!refreshState.authenticated) {
                    await clearTokens();
                } else {
                    // authenticated but if we need pin verification, it's already set in state
                    if (!refreshState.needsPin && !refreshState.needsPinSetup) {
                        const token = await getAccessToken();
                        if (token) {
                            const res = await getMe();
                            setUserName(res.name);
                            setAuthState(true, false, !res.has_pin);
                        }
                    }
                }
            } catch {
                await clearTokens();
            }
            await loadOnboardingState();
            onReady();
            SplashScreen.hideAsync();
        })();
    }, [loaded, error]);

    return null;
}

function RootNavigator() {
    const [{ authenticated, needsPin, needsPinSetup }, setAuthState] = useState(getAuthState());
    const [onboardingDone, setOnboardingDone] = useState(getOnboardingCompleted());

    useEffect(() => subscribeAuthState(setAuthState), []);
    useEffect(() => subscribeOnboarding(setOnboardingDone), []);

    const isFullyAuthed = authenticated && !needsPin && !needsPinSetup;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* PROTECTED ROUTES */}
            <Stack.Protected guard={isFullyAuthed && onboardingDone}>
                <Stack.Screen name="(tabs)" />
            </Stack.Protected>

            {/* ONBOARDING */}
            <Stack.Protected guard={isFullyAuthed && !onboardingDone}>
                <Stack.Screen name="onboarding" />
            </Stack.Protected>

            {/* PIN VERIFICATION */}
            <Stack.Protected guard={authenticated && needsPin}>
                <Stack.Screen name="pin-entry" options={{ headerShown: false }} />
            </Stack.Protected>

            {/* PIN SETUP */}
            <Stack.Protected guard={authenticated && needsPinSetup}>
                <Stack.Screen name="pin-setup" options={{ headerShown: false }} />
            </Stack.Protected>

            {/* PUBLIC ROUTES */}
            <Stack.Protected guard={!authenticated}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="index" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);

    if (!isReady)
        return <SplashScreenController onReady={() => setIsReady(true)} />;

    return <RootNavigator />;
}
