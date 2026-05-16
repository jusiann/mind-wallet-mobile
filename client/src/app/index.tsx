import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getMe } from '../api/auth';
import { clearTokens, getAccessToken } from '../store/auth';

export default function Index() {
    const [checking, setChecking] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await getAccessToken();
                if (token) {
                    await getMe();
                    setIsLoggedIn(true);
                }
            } catch {
                await clearTokens();
            } finally {
                setChecking(false);
            }
        })();
    }, []);

    if (checking) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/login'} />;
}
