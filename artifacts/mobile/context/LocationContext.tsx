import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLocation from "expo-location";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export interface UserLocation {
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  displayName: string;
}

interface LocationContextType {
  location: UserLocation | null;
  setLocation: (loc: UserLocation) => Promise<void>;
  clearLocation: () => Promise<void>;
  detectGPS: () => Promise<void>;
  gpsLoading: boolean;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | null>(null);
const STORAGE_KEY = "@farmguard_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setLocationState(JSON.parse(v)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setLocation = useCallback(async (loc: UserLocation) => {
    setLocationState(loc);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }, []);

  const clearLocation = useCallback(async () => {
    setLocationState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const detectGPS = useCallback(async () => {
    if (Platform.OS === "web") return;
    setGpsLoading(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      // Reverse geocode to get country/region
      const [geo] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      const country = geo?.country ?? "Kenya";
      const region = geo?.region ?? geo?.city ?? "Unknown";
      const displayName = [geo?.city, geo?.region, geo?.country].filter(Boolean).join(", ") || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      const loc: UserLocation = { latitude, longitude, country, region, displayName };
      setLocationState(loc);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // silently fail; location stays unchanged
    } finally {
      setGpsLoading(false);
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation, detectGPS, gpsLoading, loading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
