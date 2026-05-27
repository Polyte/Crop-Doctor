export type MoonPhaseName =
  | "New Moon"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full Moon"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent";

export interface MoonPhaseInfo {
  name: MoonPhaseName;
  emoji: string;
  illumination: number; // 0-1
  dayInCycle: number;   // 0-29.53
  gardeningAdvice: string;
}

const SYNODIC_MONTH = 29.530588853;

// Reference new moon: Jan 6, 2000 at 18:14 UTC
const KNOWN_NEW_MOON_JD = 2451550.1;

function toJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const jd = toJulianDay(date);
  const daysSinceNew = (jd - KNOWN_NEW_MOON_JD) % SYNODIC_MONTH;
  const normalized = daysSinceNew < 0 ? daysSinceNew + SYNODIC_MONTH : daysSinceNew;

  const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * normalized) / SYNODIC_MONTH));

  let name: MoonPhaseName;
  let emoji: string;
  let gardeningAdvice: string;

  if (normalized < 1.85) {
    name = "New Moon";
    emoji = "🌑";
    gardeningAdvice = "Rest and planning. Begin soil preparation. Start seeds indoors for root crops.";
  } else if (normalized < 7.38) {
    name = "Waxing Crescent";
    emoji = "🌒";
    gardeningAdvice = "Plant leafy greens and above-ground crops. Good for transplanting seedlings.";
  } else if (normalized < 9.22) {
    name = "First Quarter";
    emoji = "🌓";
    gardeningAdvice = "Strong growth energy. Excellent for planting fruiting crops and grains.";
  } else if (normalized < 14.77) {
    name = "Waxing Gibbous";
    emoji = "🌔";
    gardeningAdvice = "Good for grafting and planting. Sap rises — great for nutrient uptake.";
  } else if (normalized < 16.61) {
    name = "Full Moon";
    emoji = "🌕";
    gardeningAdvice = "Harvest fruits and leafy crops. High moisture in soil — ideal for planting.";
  } else if (normalized < 22.15) {
    name = "Waning Gibbous";
    emoji = "🌖";
    gardeningAdvice = "Excellent for harvesting root crops. Good time for applying fertilizers.";
  } else if (normalized < 23.99) {
    name = "Last Quarter";
    emoji = "🌗";
    gardeningAdvice = "Plant root crops. Good for composting and soil enrichment. Prune and weed.";
  } else {
    name = "Waning Crescent";
    emoji = "🌘";
    gardeningAdvice = "Rest period for soil. Good for weeding, cultivating, and harvesting root crops.";
  }

  return { name, emoji, illumination, dayInCycle: normalized, gardeningAdvice };
}

export function getMoonPhasesForMonth(startDate: Date): Array<{ date: Date; phase: MoonPhaseInfo }> {
  const results = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    results.push({ date: d, phase: getMoonPhase(d) });
  }
  return results;
}

export function getNextMoonEvents(from: Date = new Date()): Array<{ name: MoonPhaseName; date: Date; emoji: string }> {
  const events: Array<{ name: MoonPhaseName; date: Date; emoji: string }> = [];
  const targets: MoonPhaseName[] = ["New Moon", "First Quarter", "Full Moon", "Last Quarter"];
  const seen = new Set<MoonPhaseName>();

  for (let i = 1; i <= 30; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const p = getMoonPhase(d);
    if (targets.includes(p.name) && !seen.has(p.name)) {
      seen.add(p.name);
      events.push({ name: p.name, date: d, emoji: p.emoji });
    }
    if (seen.size === 4) break;
  }
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const MOON_GARDENING_GUIDE: Record<string, { title: string; activities: string[] }> = {
  "New Moon": {
    title: "Rest & Prepare",
    activities: ["Prepare soil", "Plan garden layout", "Clean tools", "Start compost"],
  },
  "Waxing Crescent": {
    title: "Plant Leafy Crops",
    activities: ["Sow lettuce, spinach, cabbage", "Transplant seedlings", "Water thoroughly"],
  },
  "First Quarter": {
    title: "Plant Fruiting Crops",
    activities: ["Sow beans, tomatoes, peppers", "Plant grains and cereals", "Fertilize above-ground plants"],
  },
  "Waxing Gibbous": {
    title: "Graft & Nourish",
    activities: ["Graft plants", "Apply liquid fertilizer", "Plant flowers", "Irrigate"],
  },
  "Full Moon": {
    title: "Harvest & Plant",
    activities: ["Harvest fruiting crops", "Collect seeds", "Plant moisture-loving crops", "Pick herbs"],
  },
  "Waning Gibbous": {
    title: "Harvest Root Crops",
    activities: ["Harvest root vegetables", "Apply compost", "Prune trees", "Preserve harvested crops"],
  },
  "Last Quarter": {
    title: "Root & Enrich",
    activities: ["Plant root vegetables", "Weed garden beds", "Till and aerate soil", "Compost"],
  },
  "Waning Crescent": {
    title: "Rest & Restore",
    activities: ["Harvest root crops", "Cultivate soil", "Remove dead plants", "Prepare for new cycle"],
  },
};
