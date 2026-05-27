import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const DEVICE_ID_KEY = "farmguard_device_id";
const FARMER_PROFILE_KEY = "farmguard_farmer_profile";

export interface FarmerProfile {
  id: number;
  deviceId: string;
  name: string;
  farmName: string;
  location: string;
  phone: string;
  bio: string;
}

export interface Listing {
  id: number;
  farmerId: number;
  productName: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  description: string | null;
  available: boolean;
  createdAt: string;
}

export interface ListingWithFarmer extends Listing {
  farmerName: string | null;
  farmName: string | null;
  farmerLocation: string | null;
  farmerPhone: string | null;
}

export interface RegisterFarmerData {
  name: string;
  farmName: string;
  location: string;
  phone: string;
  bio?: string;
}

export interface ListingFormData {
  productName: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  description?: string;
}

interface MarketContextType {
  farmerProfile: FarmerProfile | null;
  myListings: Listing[];
  loadingProfile: boolean;
  loadingMyListings: boolean;
  registerFarmer: (data: RegisterFarmerData) => Promise<void>;
  refreshMyListings: () => Promise<void>;
  addListing: (data: ListingFormData) => Promise<void>;
  updateListing: (id: number, data: Partial<ListingFormData>) => Promise<void>;
  deleteListing: (id: number) => Promise<void>;
  toggleAvailability: (id: number, current: boolean) => Promise<void>;
  getDeviceId: () => Promise<string>;
}

const MarketContext = createContext<MarketContextType | null>(null);

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMyListings, setLoadingMyListings] = useState(false);

  const getDeviceId = useCallback(async (): Promise<string> => {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(FARMER_PROFILE_KEY);
      if (cached) {
        const profile = JSON.parse(cached) as FarmerProfile;
        setFarmerProfile(profile);
        return profile;
      }
      const deviceId = await getDeviceId();
      const res = await fetch(`${API_BASE}/market/farmers/by-device/${deviceId}`);
      if (res.ok) {
        const profile = (await res.json()) as FarmerProfile;
        await AsyncStorage.setItem(FARMER_PROFILE_KEY, JSON.stringify(profile));
        setFarmerProfile(profile);
        return profile;
      }
    } catch {
      // Network unavailable; profile stays null
    } finally {
      setLoadingProfile(false);
    }
    setLoadingProfile(false);
    return null;
  }, [getDeviceId]);

  const refreshMyListings = useCallback(async () => {
    if (!farmerProfile) return;
    setLoadingMyListings(true);
    try {
      const res = await fetch(`${API_BASE}/market/farmers/${farmerProfile.id}/listings`);
      if (res.ok) setMyListings((await res.json()) as Listing[]);
    } finally {
      setLoadingMyListings(false);
    }
  }, [farmerProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (farmerProfile) refreshMyListings();
  }, [farmerProfile, refreshMyListings]);

  const registerFarmer = useCallback(
    async (data: RegisterFarmerData) => {
      const deviceId = await getDeviceId();
      const res = await fetch(`${API_BASE}/market/farmers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, deviceId }),
      });
      if (!res.ok) throw new Error("Registration failed");
      const profile = (await res.json()) as FarmerProfile;
      await AsyncStorage.setItem(FARMER_PROFILE_KEY, JSON.stringify(profile));
      setFarmerProfile(profile);
    },
    [getDeviceId],
  );

  const addListing = useCallback(
    async (data: ListingFormData) => {
      if (!farmerProfile) throw new Error("Not registered as farmer");
      const res = await fetch(`${API_BASE}/market/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, farmerId: farmerProfile.id, available: true }),
      });
      if (!res.ok) throw new Error("Failed to add listing");
      await refreshMyListings();
    },
    [farmerProfile, refreshMyListings],
  );

  const updateListing = useCallback(
    async (id: number, data: Partial<ListingFormData>) => {
      const res = await fetch(`${API_BASE}/market/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update listing");
      await refreshMyListings();
    },
    [refreshMyListings],
  );

  const deleteListing = useCallback(
    async (id: number) => {
      await fetch(`${API_BASE}/market/listings/${id}`, { method: "DELETE" });
      setMyListings((prev) => prev.filter((l) => l.id !== id));
    },
    [],
  );

  const toggleAvailability = useCallback(
    async (id: number, current: boolean) => {
      await fetch(`${API_BASE}/market/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !current }),
      });
      setMyListings((prev) => prev.map((l) => (l.id === id ? { ...l, available: !current } : l)));
    },
    [],
  );

  return (
    <MarketContext.Provider
      value={{
        farmerProfile,
        myListings,
        loadingProfile,
        loadingMyListings,
        registerFarmer,
        refreshMyListings,
        addListing,
        updateListing,
        deleteListing,
        toggleAvailability,
        getDeviceId,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket(): MarketContextType {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}
