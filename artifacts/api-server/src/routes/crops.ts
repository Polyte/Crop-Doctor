import { db, crops, insertCropSchema } from "@workspace/db";
import { eq, like, or } from "drizzle-orm";
import { Router } from "express";

const router = Router();

// GET all crops (with optional search/filter)
router.get("/crops", async (req, res) => {
  try {
    const { q, category, season, region } = req.query;
    let rows = await db.select().from(crops);

    // Apply filters
    if (q) {
      const search = (q as string).toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.category.toLowerCase().includes(search) ||
          (c.variety ?? "").toLowerCase().includes(search)
      );
    }
    if (category) {
      rows = rows.filter((c) => c.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (season) {
      rows = rows.filter((c) => c.seasons.toLowerCase().includes((season as string).toLowerCase()));
    }
    if (region) {
      rows = rows.filter((c) => c.regions.toLowerCase().includes((region as string).toLowerCase()));
    }

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "crops GET error");
    res.status(500).json({ error: "Failed to fetch crops" });
  }
});

// GET single crop by id
router.get("/crops/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.select().from(crops).where(eq(crops.id, id));
    if (!row) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "crops/:id GET error");
    res.status(500).json({ error: "Failed to fetch crop" });
  }
});

// GET crop categories
router.get("/crops/categories/list", async (req, res) => {
  try {
    const all = await db.select({ category: crops.category }).from(crops);
    const unique = [...new Set(all.map((c) => c.category))];
    res.json(unique);
  } catch (err) {
    req.log.error({ err }, "crops categories GET error");
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET planting calendar — what to plant this month in your region
router.get("/crops/calendar", async (req, res) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const region = (req.query.region as string) ?? "";

    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthName = MONTH_NAMES[month - 1];

    // East African seasons
    const EAF_SEASON_HINTS: Record<number, string[]> = {
      1: ["long rains", "annual"],
      2: ["long rains", "annual"],
      3: ["long rains", "annual"],
      4: ["long rains", "annual"],
      5: ["long rains", "annual"],
      6: ["cool dry", "annual"],
      7: ["cool dry", "annual"],
      8: ["short rains", "annual"],
      9: ["short rains", "annual"],
      10: ["short rains", "annual"],
      11: ["short rains", "annual"],
      12: ["hot dry", "annual"],
    };
    const hints = EAF_SEASON_HINTS[month] ?? ["annual"];

    let all = await db.select().from(crops);

    // Filter by region if given
    if (region) {
      all = all.filter(c => !region || c.regions.toLowerCase().includes(region.toLowerCase()) || c.regions.toLowerCase().includes("all regions"));
    }

    // Filter by season hints
    const inSeason = all.filter(c => {
      const s = c.seasons.toLowerCase();
      return hints.some(h => s.includes(h)) || s.includes("year-round");
    });

    res.json({
      month,
      monthName,
      region: region || "East Africa",
      crops: inSeason.slice(0, 20),
      advice: `${monthName} is a good time to plant: ${inSeason.slice(0, 5).map(c => c.name).join(", ")}${inSeason.length > 5 ? " and more" : ""}.`,
    });
  } catch (err) {
    req.log.error({ err }, "crops/calendar GET error");
    res.status(500).json({ error: "Failed to fetch planting calendar" });
  }
});

// POST add new crop (admin only — no auth, simple)
router.post("/crops", async (req, res) => {
  try {
    const parsed = insertCropSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    const [crop] = await db.insert(crops).values(parsed.data).returning();
    res.status(201).json(crop);
  } catch (err) {
    req.log.error({ err }, "crops POST error");
    res.status(500).json({ error: "Failed to add crop" });
  }
});

export default router;
