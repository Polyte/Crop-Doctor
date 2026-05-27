import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiagnosisProvider } from "@/context/DiagnosisContext";
import { GrowPlanProvider } from "@/context/GrowPlanContext";
import { LocationProvider } from "@/context/LocationContext";
import { MarketProvider } from "@/context/MarketContext";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="result/[id]" options={{ title: "Diagnosis Result", presentation: "card" }} />
      <Stack.Screen name="grow-plan/[id]" options={{ title: "Grow Plan", presentation: "card" }} />
      <Stack.Screen name="market/add-listing" options={{ title: "Add Product", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LocationProvider>
            <MarketProvider>
            <GrowPlanProvider>
              <DiagnosisProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </DiagnosisProvider>
            </GrowPlanProvider>
            </MarketProvider>
          </LocationProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
