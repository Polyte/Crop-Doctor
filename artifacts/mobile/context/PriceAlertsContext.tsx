import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@farmguard_price_alerts";
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface PriceAlert {
  listingId: number;
  productName: string;
  targetPrice: number;
  currentPrice: number;
}

interface PriceAlertsContextType {
  alerts: PriceAlert[];
  isWatching: (listingId: number) => boolean;
  watchListing: (listingId: number, productName: string, currentPrice: number, targetPrice: number) => Promise<void>;
  unwatchListing: (listingId: number) => Promise<void>;
}

const PriceAlertsContext = createContext<PriceAlertsContextType>({
  alerts: [],
  isWatching: () => false,
  watchListing: async () => {},
  unwatchListing: async () => {},
});

export function PriceAlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setAlerts(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const save = async (updated: PriceAlert[]) => {
    setAlerts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const isWatching = useCallback((id: number) => alerts.some(a => a.listingId === id), [alerts]);

  const watchListing = useCallback(async (listingId: number, productName: string, currentPrice: number, targetPrice: number) => {
    const updated = [...alerts.filter(a => a.listingId !== listingId), { listingId, productName, targetPrice, currentPrice }];
    await save(updated);
  }, [alerts]);

  const unwatchListing = useCallback(async (listingId: number) => {
    await save(alerts.filter(a => a.listingId !== listingId));
  }, [alerts]);

  // Check prices on mount
  useEffect(() => {
    if (alerts.length === 0 || Platform.OS === "web") return;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/market/listings`);
        if (!res.ok) return;
        const listings: Array<{ id: number; price: number; productName: string }> = await res.json();
        for (const alert of alerts) {
          const live = listings.find(l => l.id === alert.listingId);
          if (!live) continue;
          if (live.price <= alert.targetPrice) {
            const { status } = await Notifications.getPermissionsAsync() as any;
            if (status === "granted") {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "📉 Price Drop Alert!",
                  body: `${alert.productName} is now KSh ${live.price.toLocaleString()} — at or below your target of KSh ${alert.targetPrice.toLocaleString()}.`,
                  sound: "default",
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, repeats: false },
              });
            }
          }
        }
      } catch {
        // silently ignore
      }
    };
    check();
  }, []);

  return (
    <PriceAlertsContext.Provider value={{ alerts, isWatching, watchListing, unwatchListing }}>
      {children}
    </PriceAlertsContext.Provider>
  );
}

export function usePriceAlerts() {
  return useContext(PriceAlertsContext);
}
