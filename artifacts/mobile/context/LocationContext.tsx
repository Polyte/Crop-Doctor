import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | null>(null);
const STORAGE_KEY = "@farmguard_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation, loading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
