import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { useBrand } from "@/app/contexts/BrandContext";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const { selectedBrand } = useBrand(); 

  const bgColor =
    selectedBrand === "MAGNUM" ? "#ffd700" : "#d60000ff";

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,

        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 32,
          backgroundColor: bgColor, 
          borderTopWidth: 0,
          marginHorizontal: 20,
          paddingBottom: 0,
          paddingTop: 0,
        },

        tabBarItemStyle: {
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarIconStyle: {
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <IconSymbol
                name="house.fill"
                size={30}
                color={focused ? "#fff" : "rgba(255,255,255,0.6)"}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="analysis"
        options={{
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="chart.bar.fill"
              size={30}
              color={focused ? "#fff" : "rgba(255,255,255,0.6)"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="magnifyingglass"
              size={30}
              color={focused ? "#fff" : "rgba(255,255,255,0.6)"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="person.fill"
              size={30}
              color={focused ? "#fff" : "rgba(255,255,255,0.6)"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
