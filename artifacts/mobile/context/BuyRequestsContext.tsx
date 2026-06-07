import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface BuyRequest {
  id: string;
  cropName: string;
  quantityKg: number;
  maxPricePerKg: number;
  currency: string;
  location: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  createdAt: string;
  deviceId: string;
}

interface BuyRequestsContextType {
  requests: BuyRequest[];
  myRequests: BuyRequest[];
  addRequest: (req: Omit<BuyRequest, "id" | "createdAt" | "deviceId">) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  deviceId: string;
}

const STORAGE_KEY = "@farmguard_buy_requests";
const DEVICE_KEY = "@farmguard_device_id";

const BuyRequestsContext = createContext<BuyRequestsContextType>({
  requests: [],
  myRequests: [],
  addRequest: async () => {},
  deleteRequest: async () => {},
  deviceId: "",
});

export function BuyRequestsProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, DEVICE_KEY]).then(([[, stored], [, did]]) => {
      if (stored) setRequests(JSON.parse(stored));
      if (did) {
        setDeviceId(did);
      } else {
        const id = Math.random().toString(36).slice(2);
        setDeviceId(id);
        AsyncStorage.setItem(DEVICE_KEY, id);
      }
    }).catch(() => {});
  }, []);

  const persist = useCallback(async (next: BuyRequest[]) => {
    setRequests(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addRequest = useCallback(async (req: Omit<BuyRequest, "id" | "createdAt" | "deviceId">) => {
    const newReq: BuyRequest = {
      ...req,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      deviceId,
    };
    await persist([newReq, ...requests]);
  }, [requests, persist, deviceId]);

  const deleteRequest = useCallback(async (id: string) => {
    await persist(requests.filter((r) => r.id !== id));
  }, [requests, persist]);

  const myRequests = requests.filter((r) => r.deviceId === deviceId);

  return (
    <BuyRequestsContext.Provider value={{ requests, myRequests, addRequest, deleteRequest, deviceId }}>
      {children}
    </BuyRequestsContext.Provider>
  );
}

export function useBuyRequests() {
  return useContext(BuyRequestsContext);
}
