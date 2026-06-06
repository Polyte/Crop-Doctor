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
