export type Hemisphere = "northern" | "southern" | "tropical";
export type Season = "spring" | "summer" | "autumn" | "winter" | "dry" | "wet";

export interface SeasonInfo {
  hemisphere: Hemisphere;
  season: Season;
  label: string;
  emoji: string;
  description: string;
  monthRange: string;
}

export function getHemisphere(latitude: number): Hemisphere {
  if (latitude > 23.5) return "northern";
  if (latitude < -23.5) return "southern";
  return "tropical";
}

export function getSeason(latitude: number, date: Date = new Date()): SeasonInfo {
  const month = date.getMonth(); // 0-11
  const hemisphere = getHemisphere(latitude);

  if (hemisphere === "tropical") {
    // Simplified tropical: wet (Apr-Sep NH equivalent) vs dry
    const isWet = month >= 3 && month <= 8;
    return isWet
      ? {
          hemisphere,
          season: "wet",
          label: "Wet Season",
          emoji: "🌧️",
          description: "Heavy rains and high humidity. Ideal for many tropical crops.",
          monthRange: "April – September",
        }
      : {
          hemisphere,
          season: "dry",
          label: "Dry Season",
          emoji: "☀️",
          description: "Low rainfall and cooler nights. Good for drought-tolerant crops.",
          monthRange: "October – March",
        };
  }

  // Northern hemisphere seasons
  const nhSeason = (m: number): Season => {
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  };

  // Southern hemisphere is opposite
  const shSeason = (m: number): Season => {
    if (m >= 2 && m <= 4) return "autumn";
    if (m >= 5 && m <= 7) return "winter";
    if (m >= 8 && m <= 10) return "spring";
    return "summer";
  };

  const season = hemisphere === "northern" ? nhSeason(month) : shSeason(month);

  const SEASON_META: Record<Season, { label: string; emoji: string; description: string; monthRange: string }> = {
    spring: {
      label: "Spring",
      emoji: "🌸",
      description: "Warming days and moderate rainfall. Perfect for sowing most vegetables.",
      monthRange: hemisphere === "northern" ? "March – May" : "September – November",
    },
    summer: {
      label: "Summer",
      emoji: "☀️",
      description: "Long warm days with potential drought. Focus on heat-tolerant crops.",
      monthRange: hemisphere === "northern" ? "June – August" : "December – February",
    },
    autumn: {
      label: "Autumn",
      emoji: "🍂",
      description: "Cooling temperatures, ideal for cool-season crops and harvest.",
      monthRange: hemisphere === "northern" ? "September – November" : "March – May",
    },
    winter: {
      label: "Winter",
      emoji: "❄️",
      description: "Cold conditions. Focus on indoor growing, soil prep, and planning.",
      monthRange: hemisphere === "northern" ? "December – February" : "June – August",
    },
    dry: { label: "Dry Season", emoji: "☀️", description: "", monthRange: "" },
    wet: { label: "Wet Season", emoji: "🌧️", description: "", monthRange: "" },
  };

  return { hemisphere, season, ...SEASON_META[season] };
}

export function getSeasonCropRecommendations(season: Season, hemisphere: Hemisphere): string[] {
  const map: Record<Season, string[]> = {
    spring: ["Tomatoes", "Beans", "Zucchini", "Lettuce", "Peas", "Carrots", "Basil", "Cucumber", "Peppers", "Spinach"],
    summer: ["Sweet Corn", "Okra", "Watermelon", "Sweet Potato", "Pumpkin", "Eggplant", "Amaranth", "Cowpeas"],
    autumn: ["Cabbage", "Broccoli", "Kale", "Garlic", "Onions", "Turnips", "Beets", "Cauliflower", "Radishes"],
    winter: ["Broad Beans", "Winter Wheat", "Leeks", "Brussels Sprouts", "Spinach", "Swiss Chard"],
    wet: ["Rice", "Taro", "Ginger", "Yam", "Cassava", "Plantain", "Sweet Potato", "Amaranth"],
    dry: ["Sorghum", "Millet", "Groundnuts", "Cowpeas", "Maize", "Sunflower", "Sesame", "Drought-resistant Beans"],
  };
  return map[season] ?? [];
}
