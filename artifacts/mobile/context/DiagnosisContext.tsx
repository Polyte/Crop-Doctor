import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface DiagnosisRecord {
  id: string;
  condition: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  summary: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
  urgency: string;
  subjectType: "crop" | "livestock";
  cropType?: string;
  livestockType?: string;
  description: string;
  imageUri?: string;
  timestamp: string;
}

interface DiagnosisContextType {
  diagnoses: DiagnosisRecord[];
  addDiagnosis: (record: DiagnosisRecord) => Promise<void>;
  deleteDiagnosis: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  loading: boolean;
}

const DiagnosisContext = createContext<DiagnosisContextType | null>(null);

const STORAGE_KEY = "@farmguard_diagnoses";

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setDiagnoses(JSON.parse(stored));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (records: DiagnosisRecord[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, []);

  const addDiagnosis = useCallback(async (record: DiagnosisRecord) => {
    setDiagnoses(prev => {
      const updated = [record, ...prev];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const deleteDiagnosis = useCallback(async (id: string) => {
    setDiagnoses(prev => {
      const updated = prev.filter(d => d.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearAll = useCallback(async () => {
    setDiagnoses([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <DiagnosisContext.Provider value={{ diagnoses, addDiagnosis, deleteDiagnosis, clearAll, loading }}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
}
