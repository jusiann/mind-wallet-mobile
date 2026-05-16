import {
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        HankenGrotesk_400Regular,
        HankenGrotesk_500Medium,
        HankenGrotesk_600SemiBold,
        HankenGrotesk_700Bold,
    });

    useEffect(() => {
        if (loaded || error)
            SplashScreen.hideAsync();
    }, [loaded, error]);

    if (!loaded && !error) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}
