import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "./LocationContext";

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

const ALERT_KEY = "@farmguard_weather_alert_date";

async function scheduleWeatherAlert(weather: WeatherData) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.getPermissionsAsync() as any;
    if (status !== "granted") return;

    // Only alert once per day
    const today = new Date().toISOString().slice(0, 10);
    const lastAlert = await AsyncStorage.getItem(ALERT_KEY);
    if (lastAlert === today) return;

    const maxRain = Math.max(weather.rainChance, ...weather.forecast.map(f => f.rainChance));
    const maxTemp = Math.max(weather.dailyHigh, ...weather.forecast.map(f => f.temp));

    let title = "";
    let body = "";

    if (maxRain >= 70) {
      title = "🌧️ Heavy Rain Forecast";
      body = `Rain ${maxRain}% chance this week. Harvest ripe crops and cover seedlings before it starts.`;
    } else if (maxTemp >= 36) {
      title = "🌡️ Heat Alert for Your Farm";
      body = `Temperatures up to ${maxTemp}°C expected. Water crops early morning and provide shade for livestock.`;
    } else if (weather.humidity > 85) {
      title = "💧 High Humidity Alert";
      body = `Humidity at ${weather.humidity}%. Watch for fungal diseases on your crops — apply preventive fungicide if needed.`;
    }

    if (title) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: "default" },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
      });
      await AsyncStorage.setItem(ALERT_KEY, today);
    }
  } catch {
    // Silently ignore notification errors
  }
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = locationRef.current;
      // Fall back to Nairobi if no location set
      const lat = loc?.latitude ?? -1.2921;
      const lon = loc?.longitude ?? 36.8219;
      const url = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/weather?lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error("Failed to fetch weather");
      const data = await res.json();
      setWeather(data);
      scheduleWeatherAlert(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Weather unavailable");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when location changes
  useEffect(() => {
    fetchWeather();
  }, [location?.latitude, location?.longitude]);

  // Also refresh every 30 min
  useEffect(() => {
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
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
