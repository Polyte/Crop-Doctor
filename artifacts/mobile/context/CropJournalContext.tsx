import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type JournalActivity =
  | "watering" | "weeding" | "fertilizing" | "harvesting"
  | "pruning" | "spraying" | "sowing" | "observation" | "other";

export interface JournalEntry {
  id: string;
  date: string;
  activity: JournalActivity;
  cropType?: string;
  plotName?: string;
  notes: string;
  weatherNote?: string;
}

interface CropJournalContextType {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, "id">) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const STORAGE_KEY = "@farmguard_journal";

const CropJournalContext = createContext<CropJournalContextType>({
  entries: [],
  addEntry: async () => {},
  deleteEntry: async () => {},
});

export function CropJournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v) setEntries(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (next: JournalEntry[]) => {
    setEntries(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addEntry = useCallback(async (entry: Omit<JournalEntry, "id">) => {
    const newEntry: JournalEntry = { ...entry, id: Date.now().toString() };
    await persist([newEntry, ...entries]);
  }, [entries, persist]);

  const deleteEntry = useCallback(async (id: string) => {
    await persist(entries.filter((e) => e.id !== id));
  }, [entries, persist]);

  return (
    <CropJournalContext.Provider value={{ entries, addEntry, deleteEntry }}>
      {children}
    </CropJournalContext.Provider>
  );
}

export function useCropJournal() {
  return useContext(CropJournalContext);
}
