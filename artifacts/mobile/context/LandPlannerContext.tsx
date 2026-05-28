import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const DEVICE_ID_KEY = "farmguard_device_id";

export interface LandPlot {
  id: number;
  deviceId: string;
  name: string;
  area: number | null;
  unit: string;
  centerLat: number | null;
  centerLon: number | null;
  polygon: string; // JSON of [{x,y}]
  createdAt: string;
  plantsCount?: number;
  plants?: LandPlant[];
}

export interface LandPlant {
  id: number;
  plotId: number;
  name: string;
  variety: string | null;
  plantX: number;
  plantY: number;
  healthStatus: string;
  photoUri: string | null;
  notes: string | null;
  plantedDate: string | null;
  createdAt: string;
}

export interface PlantFollowup {
  id: number;
  plantId: number;
  action: string;
  description: string | null;
  healthStatus: string;
  photoUri: string | null;
  createdAt: string;
}

export interface AgroStore {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  lat: number;
  lon: number;
  products: string | null;
  distance: number;
}

export interface PlotWithPlants extends LandPlot {
  plants: LandPlant[];
}

export interface PlantWithFollowups extends LandPlant {
  followups: PlantFollowup[];
}

interface LandPlannerContextType {
  plots: LandPlot[];
  loadingPlots: boolean;
  refreshPlots: () => Promise<void>;
  createPlot: (data: { name: string; area?: number; unit?: string; centerLat?: number; centerLon?: number; polygon: { x: number; y: number }[] }) => Promise<LandPlot>;
  deletePlot: (id: number) => Promise<void>;
  getPlot: (id: number) => Promise<PlotWithPlants>;
  getPlant: (id: number) => Promise<PlantWithFollowups>;
  addPlant: (data: { plotId: number; name: string; variety?: string; plantX: number; plantY: number; healthStatus?: string; photoUri?: string; notes?: string; plantedDate?: string }) => Promise<LandPlant>;
  updatePlant: (id: number, data: { healthStatus?: string; notes?: string; photoUri?: string }) => Promise<void>;
  deletePlant: (id: number) => Promise<void>;
  addFollowup: (data: { plantId: number; action: string; description?: string; healthStatus?: string; photoUri?: string }) => Promise<PlantFollowup>;
  getFollowups: (plantId: number) => Promise<PlantFollowup[]>;
  getStores: (lat: number, lon: number, category?: string) => Promise<AgroStore[]>;
  getDeviceId: () => Promise<string>;
}

const LandPlannerContext = createContext<LandPlannerContextType | null>(null);

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function LandPlannerProvider({ children }: { children: React.ReactNode }) {
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);

  const getDeviceId = useCallback(async (): Promise<string> => {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }, []);

  const refreshPlots = useCallback(async () => {
    const deviceId = await getDeviceId();
    setLoadingPlots(true);
    try {
      const res = await fetch(`${API_BASE}/land/plots?deviceId=${encodeURIComponent(deviceId)}`);
      if (res.ok) setPlots(await res.json());
    } finally { setLoadingPlots(false); }
  }, [getDeviceId]);

  useEffect(() => { refreshPlots(); }, [refreshPlots]);

  const createPlot = useCallback(async (data: { name: string; area?: number; unit?: string; centerLat?: number; centerLon?: number; polygon: { x: number; y: number }[] }): Promise<LandPlot> => {
    const deviceId = await getDeviceId();
    const res = await fetch(`${API_BASE}/land/plots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, deviceId, polygon: JSON.stringify(data.polygon) }),
    });
    if (!res.ok) throw new Error("Failed to create plot");
    const plot = (await res.json()) as LandPlot;
    setPlots((prev) => [plot, ...prev]);
    return plot;
  }, [getDeviceId]);

  const deletePlot = useCallback(async (id: number) => {
    await fetch(`${API_BASE}/land/plots/${id}`, { method: "DELETE" });
    setPlots((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPlot = useCallback(async (id: number): Promise<PlotWithPlants> => {
    const res = await fetch(`${API_BASE}/land/plots/${id}`);
    if (!res.ok) throw new Error("Plot not found");
    return await res.json() as PlotWithPlants;
  }, []);

  const getPlant = useCallback(async (id: number): Promise<PlantWithFollowups> => {
    const res = await fetch(`${API_BASE}/land/plants/detail/${id}`);
    if (!res.ok) throw new Error("Plant not found");
    return await res.json() as PlantWithFollowups;
  }, []);

  const addPlant = useCallback(async (data: { plotId: number; name: string; variety?: string; plantX: number; plantY: number; healthStatus?: string; photoUri?: string; notes?: string; plantedDate?: string }): Promise<LandPlant> => {
    const res = await fetch(`${API_BASE}/land/plants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add plant");
    return (await res.json()) as LandPlant;
  }, []);

  const updatePlant = useCallback(async (id: number, data: { healthStatus?: string; notes?: string; photoUri?: string }) => {
    const res = await fetch(`${API_BASE}/land/plants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update plant");
  }, []);

  const deletePlant = useCallback(async (id: number) => {
    await fetch(`${API_BASE}/land/plants/${id}`, { method: "DELETE" });
  }, []);

  const addFollowup = useCallback(async (data: { plantId: number; action: string; description?: string; healthStatus?: string; photoUri?: string }): Promise<PlantFollowup> => {
    const res = await fetch(`${API_BASE}/land/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add followup");
    return (await res.json()) as PlantFollowup;
  }, []);

  const getFollowups = useCallback(async (plantId: number): Promise<PlantFollowup[]> => {
    const res = await fetch(`${API_BASE}/land/followups/${plantId}`);
    if (!res.ok) throw new Error("Failed to fetch followups");
    return await res.json() as PlantFollowup[];
  }, []);

  const getStores = useCallback(async (lat: number, lon: number, category?: string): Promise<AgroStore[]> => {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (category) params.set("category", category);
    const res = await fetch(`${API_BASE}/land/stores?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch stores");
    return await res.json() as AgroStore[];
  }, []);

  return (
    <LandPlannerContext.Provider value={{ plots, loadingPlots, refreshPlots, createPlot, deletePlot, getPlot, getPlant, addPlant, updatePlant, deletePlant, addFollowup, getFollowups, getStores, getDeviceId }}>
      {children}
    </LandPlannerContext.Provider>
  );
}

export function useLandPlanner(): LandPlannerContextType {
  const ctx = useContext(LandPlannerContext);
  if (!ctx) throw new Error("useLandPlanner must be used inside LandPlannerProvider");
  return ctx;
}
