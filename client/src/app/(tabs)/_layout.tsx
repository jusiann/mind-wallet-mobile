import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { COLORS } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "HankenGrotesk_600SemiBold",
          fontSize: 22,
          color: COLORS.textPrimary,
        },
        headerTitleContainerStyle: { paddingLeft: 8 },
        headerTitleAlign: "left",
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: "HankenGrotesk_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mind Wallet",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-hub"
        options={{
          title: "Mind Wallet",
          tabBarLabel: "Mindy",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transact"
        options={{
          title: "Mind Wallet",
          tabBarLabel: "Transact",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Mind Wallet",
          tabBarLabel: "Goals",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "flag" : "flag-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
