import React, { createContext, useContext, useEffect, useState } from "react";

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  rainChance: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  dailyHigh: number;
  dailyLow: number;
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
    icon: string;
    rainChance: number;
  }>;
  farmingAdvice: string;
}

interface WeatherContextType {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType>({
  weather: null,
  loading: false,
  error: null,
  refresh: async () => {},
});

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // Default to Nairobi, Kenya for demo
      const url = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/weather?lat=-1.2921&lon=36.8219`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error("Failed to fetch weather");
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Weather unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(interval);
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, loading, error, refresh: fetchWeather }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
