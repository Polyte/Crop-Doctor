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
import { LandPlannerProvider } from "@/context/LandPlannerContext";
import { LocationProvider } from "@/context/LocationContext";
import { MarketProvider } from "@/context/MarketContext";
import { I18nProvider } from "@/context/LanguageContext";
import { WeatherProvider } from "@/context/WeatherContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PriceAlertsProvider } from "@/context/PriceAlertsContext";
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
      <Stack.Screen name="land/plot-creator" options={{ title: "Create Land Plot", headerShown: false }} />
      <Stack.Screen name="land/plot-detail" options={{ title: "Land Plot", headerShown: false }} />
      <Stack.Screen name="land/plant-detail" options={{ title: "Plant Detail", headerShown: false }} />
      <Stack.Screen name="land/stores" options={{ title: "Nearby Agro Stores", headerShown: false }} />
      <Stack.Screen name="planting-calendar" options={{ title: "Planting Calendar", headerShown: false }} />
      <Stack.Screen name="community-reports" options={{ title: "Disease Outbreaks", headerShown: false }} />
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
          <I18nProvider>
            <LocationProvider>
              <WeatherProvider>
                <LandPlannerProvider>
                  <MarketProvider>
                    <GrowPlanProvider>
                      <DiagnosisProvider>
                        <PriceAlertsProvider>
                        <NotificationProvider>
                          <GestureHandlerRootView>
                            <KeyboardProvider>
                              <RootLayoutNav />
                            </KeyboardProvider>
                          </GestureHandlerRootView>
                        </NotificationProvider>
                        </PriceAlertsProvider>
                      </DiagnosisProvider>
                    </GrowPlanProvider>
                  </MarketProvider>
                </LandPlannerProvider>
              </WeatherProvider>
            </LocationProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
