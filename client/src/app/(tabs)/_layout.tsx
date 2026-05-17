import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                    paddingTop: 4,
                },
                tabBarLabelStyle: {
                    fontFamily: 'HankenGrotesk_500Medium',
                    fontSize: 11,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ai-hub"
                options={{
                    title: 'AI Hub',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="transact"
                options={{
                    title: 'Transact',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="goals"
                options={{
                    title: 'Goals',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'flag' : 'flag-outline'} size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
