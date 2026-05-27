import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface GrowPhase {
  name: string;
  startDay: number;
  endDay: number;
  activities: string[];
  moonAdvice: string;
  bestMoonPhases: string[];
  tips: string[];
}

export interface GrowPlan {
  id: string;
  cropName: string;
  location: string;
  season: string;
  hemisphere: string;
  totalDays: number;
  startDate: string;
  phases: GrowPhase[];
  moonGuide: Record<string, string>;
  generalTips: string[];
  timestamp: string;
}

interface GrowPlanContextType {
  plans: GrowPlan[];
  addPlan: (plan: GrowPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  loading: boolean;
}

const GrowPlanContext = createContext<GrowPlanContextType | null>(null);
const STORAGE_KEY = "@farmguard_growplans";

export function GrowPlanProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<GrowPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setPlans(JSON.parse(v)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (items: GrowPlan[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addPlan = useCallback(async (plan: GrowPlan) => {
    setPlans(prev => {
      const updated = [plan, ...prev];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const deletePlan = useCallback(async (id: string) => {
    setPlans(prev => {
      const updated = prev.filter(p => p.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  return (
    <GrowPlanContext.Provider value={{ plans, addPlan, deletePlan, loading }}>
      {children}
    </GrowPlanContext.Provider>
  );
}

export function useGrowPlan() {
  const ctx = useContext(GrowPlanContext);
  if (!ctx) throw new Error("useGrowPlan must be used within GrowPlanProvider");
  return ctx;
}
