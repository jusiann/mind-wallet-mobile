import {
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import { clearTokens, getAccessToken, getAuthState, setAuthState, subscribeAuthState } from '../store/auth';

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
                const token = await getAccessToken();
                if (token) {
                    await getMe();
                    setAuthState(true);
                }
            } catch {
                await clearTokens();
            }
            onReady();
            SplashScreen.hideAsync();
        })();
    }, [loaded, error]);

    return null;
}

function RootNavigator() {
    const [authenticated, setAuthenticated] = useState(getAuthState());

    useEffect(() => subscribeAuthState(setAuthenticated), []);

    return (
        <Stack key={String(authenticated)} screenOptions={{ headerShown: false }}>
            {/* PROTECTED ROUTES */}
            <Stack.Protected guard={authenticated}>
                <Stack.Screen name="(tabs)" />
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
