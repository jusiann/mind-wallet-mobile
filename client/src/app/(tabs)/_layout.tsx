import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function label(text: string) {
    return ({ focused }: { focused: boolean }) =>
        focused ? (
            <Text style={{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: COLORS.primary }}>
                {text}
            </Text>
        ) : null;
}

function icon(outline: IoniconName, filled: IoniconName) {
    return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
        <Ionicons name={focused ? filled : outline} size={size} color={color} />
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: COLORS.background },
                headerShadowVisible: false,
                headerTitleStyle: {
                    fontFamily: 'HankenGrotesk_600SemiBold',
                    fontSize: 22,
                    color: COLORS.textPrimary,
                },
                headerTitleContainerStyle: { paddingLeft: 8 },
                headerTitleAlign: 'left',
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: { backgroundColor: COLORS.white },
            }}
        >
            <Tabs.Screen name="index"    options={{ title: 'Mind Wallet', tabBarLabel: label('Ana Sayfa'), tabBarIcon: icon('grid-outline', 'grid') }} />
            <Tabs.Screen name="ai-hub"   options={{ title: 'Mind Wallet', tabBarLabel: label('Mindy'),     tabBarIcon: icon('sparkles-outline', 'sparkles') }} />
            <Tabs.Screen name="transact" options={{ title: 'Mind Wallet', tabBarLabel: label('İşlemler'),  tabBarIcon: icon('swap-horizontal-outline', 'swap-horizontal') }} />
            <Tabs.Screen name="goals"    options={{ title: 'Mind Wallet', tabBarLabel: label('Hedefler'),  tabBarIcon: icon('flag-outline', 'flag') }} />
            <Tabs.Screen name="profile"  options={{ href: null, headerShown: false }} />
            <Tabs.Screen name="report"   options={{ href: null, headerShown: false }} />
            <Tabs.Screen name="recurring" options={{ href: null, headerShown: false }} />
        </Tabs>
    );
}
