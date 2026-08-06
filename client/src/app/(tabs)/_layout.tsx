import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    
    return (
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    
                    // Görünmemesi gereken sekmeleri (ör: profile, report) gizleyelim
                    if (!['index', 'ai-hub', 'transact', 'goals'].includes(route.name)) return null;
                    if (options.href === null) return null;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconName: IoniconName = 'grid-outline';
                    let filledIconName: IoniconName = 'grid';
                    let label = 'Tab';
                    
                    if (route.name === 'index') { iconName = 'grid-outline'; filledIconName = 'grid'; label = 'Ana Sayfa'; }
                    if (route.name === 'ai-hub') { iconName = 'sparkles-outline'; filledIconName = 'sparkles'; label = 'Mindy'; }
                    if (route.name === 'transact') { iconName = 'swap-horizontal-outline'; filledIconName = 'swap-horizontal'; label = 'İşlemler'; }
                    if (route.name === 'goals') { iconName = 'flag-outline'; filledIconName = 'flag'; label = 'Hedefler'; }

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[
                                styles.tabButton,
                                isFocused && styles.tabButtonFocused
                            ]}
                        >
                            <Ionicons 
                                name={isFocused ? filledIconName : iconName} 
                                size={22} 
                                color={isFocused ? COLORS.white : COLORS.textSecondary} 
                            />
                            {isFocused && (
                                <Text style={styles.tabLabelFocused}>
                                    {label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
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
            }}
            sceneContainerStyle={{
                backgroundColor: COLORS.background,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Mind Wallet' }} />
            <Tabs.Screen name="ai-hub" options={{ title: 'Mind Wallet' }} />
            <Tabs.Screen name="transact" options={{ title: 'Mind Wallet' }} />
            <Tabs.Screen name="goals" options={{ title: 'Mind Wallet' }} />
            <Tabs.Screen name="profile" options={{ href: null, headerShown: false }} />
            <Tabs.Screen name="report" options={{ href: null, headerShown: false }} />
            <Tabs.Screen name="recurring" options={{ href: null, headerShown: false }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 40,
        paddingHorizontal: 6,
        paddingVertical: 6, // Beyaz kapsülü dikeyde ince tutar, aktif kapsüle sarılır
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        marginHorizontal: 4,
    },
    tabButtonFocused: {
        backgroundColor: COLORS.primary, // Aktif sekme arka planı
    },
    tabLabelFocused: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 13,
        color: COLORS.white,
        marginLeft: 6,
    }
});
