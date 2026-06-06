import { Router } from "express";

const router = Router();

interface WeatherResponse {
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

const ICON_MAP: Record<string, string> = {
  "clear sky": "sun",
  "mainly clear": "sun",
  "partly cloudy": "cloud-sun",
  "overcast": "cloud",
  "fog": "fog",
  "freezing fog": "fog",
  "light drizzle": "cloud-rain",
  "drizzle": "cloud-rain",
  "heavy drizzle": "cloud-rain",
  "light rain": "cloud-rain",
  "rain": "cloud-rain",
  "moderate rain": "cloud-rain",
  "heavy rain": "cloud-showers-heavy",
  "light showers": "cloud-rain",
  "showers": "cloud-showers-heavy",
  "heavy showers": "cloud-showers-heavy",
  "light snow": "snowflake",
  "snow": "snowflake",
  "heavy snow": "snowflake",
  "thunderstorm": "bolt",
  "light thunderstorm": "bolt",
  "heavy thunderstorm": "bolt",
};

function getFarmingAdvice(w: WeatherResponse): string {
  if (w.rainChance > 80) return "Heavy rain expected — avoid spraying, good for natural irrigation.";
  if (w.rainChance > 40) return "Rain likely — delay harvesting, good for planting.";
  if (w.temp > 35) return "Very hot — increase watering, watch for heat stress.";
  if (w.temp < 10) return "Cold — protect tender plants from frost.";
  if (w.windSpeed > 15) return "Windy — delay spraying, secure loose structures.";
  if (w.humidity > 85) return "High humidity — watch for fungal diseases, ensure ventilation.";
  if (w.humidity < 30) return "Dry air — increase watering, mulch to retain moisture.";
  return "Good conditions for most farm activities.";
}

router.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      res.status(400).json({ error: "lat and lon are required" });
      return;
    }

    // Open-Meteo — free, no API key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      res.status(502).json({ error: "Weather service unavailable" });
      return;
    }

    const data = (await resp.json()) as Record<string, any>;
    const current = data.current as Record<string, any>;
    const daily = data.daily as Record<string, any>;

    const wmoCode = current.weather_code as number;
    const codeMap: Record<number, { condition: string; description: string }> = {
      0: { condition: "Clear", description: "Clear sky" },
      1: { condition: "Clear", description: "Mainly clear" },
      2: { condition: "Cloudy", description: "Partly cloudy" },
      3: { condition: "Cloudy", description: "Overcast" },
      45: { condition: "Fog", description: "Fog" },
      48: { condition: "Fog", description: "Freezing fog" },
      51: { condition: "Rain", description: "Light drizzle" },
      53: { condition: "Rain", description: "Drizzle" },
      55: { condition: "Rain", description: "Heavy drizzle" },
      61: { condition: "Rain", description: "Light rain" },
      63: { condition: "Rain", description: "Rain" },
      65: { condition: "Rain", description: "Heavy rain" },
      71: { condition: "Snow", description: "Light snow" },
      73: { condition: "Snow", description: "Snow" },
      75: { condition: "Snow", description: "Heavy snow" },
      80: { condition: "Rain", description: "Light showers" },
      81: { condition: "Rain", description: "Showers" },
      82: { condition: "Rain", description: "Heavy showers" },
      95: { condition: "Storm", description: "Thunderstorm" },
      96: { condition: "Storm", description: "Thunderstorm" },
      99: { condition: "Storm", description: "Heavy thunderstorm" },
    };
    const weatherInfo = codeMap[wmoCode] ?? { condition: "Unknown", description: "Unknown" };

    const forecast = (daily.time as string[]).slice(1, 5).map((t: string, i: number) => {
      const dayCode = (daily.weather_code as number[])[i + 1];
      const dayInfo = codeMap[dayCode] ?? { condition: "Unknown", description: "Unknown" };
      const date = new Date(t);
      return {
        day: i === 0 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" }),
        temp: Math.round((daily.temperature_2m_max as number[])[i + 1]),
        condition: dayInfo.condition,
        icon: ICON_MAP[dayInfo.description] ?? "cloud",
        rainChance: (daily.precipitation_probability_max as number[])[i + 1] ?? 0,
      };
    });

    const weather: WeatherResponse = {
      temp: Math.round(current.temperature_2m as number),
      feelsLike: Math.round(current.apparent_temperature as number),
      humidity: current.relative_humidity_2m as number,
      windSpeed: current.wind_speed_10m as number,
      condition: weatherInfo.condition,
      description: weatherInfo.description,
      icon: ICON_MAP[weatherInfo.description] ?? "sun",
      rainChance: (current.precipitation_probability as number) ?? 0,
      uvIndex: (current.uv_index as number) ?? 0,
      sunrise: (daily.sunrise as string[])?.[0] ?? "",
      sunset: (daily.sunset as string[])?.[0] ?? "",
      dailyHigh: Math.round((daily.temperature_2m_max as number[])[0]),
      dailyLow: Math.round((daily.temperature_2m_min as number[])[0]),
      forecast,
      farmingAdvice: "",
    };

    weather.farmingAdvice = getFarmingAdvice(weather);

    res.json(weather);
  } catch (err) {
    req.log.error({ err }, "Weather error");
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

export default router;
