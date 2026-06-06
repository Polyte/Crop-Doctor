import { db, landPlots, landPlants, plantFollowups, agroStores } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { Router } from "express";

const router = Router();

// ─── LAND PLOTS ─────────────────────────────────────────────────────────────────────

router.get("/land/plots", async (req, res) => {
  try {
    const deviceId = req.query.deviceId as string;
    if (!deviceId) { res.status(400).json({ error: "deviceId required" }); return; }
    const rows = await db.select().from(landPlots).where(eq(landPlots.deviceId, deviceId)).orderBy(desc(landPlots.createdAt));
    // Count plants per plot
    const withCounts = await Promise.all(rows.map(async (plot) => {
      const count = await db.select({ count: sql<number>`count(*)` }).from(landPlants).where(eq(landPlants.plotId, plot.id));
      return { ...plot, plantsCount: count[0]?.count ?? 0 };
    }));
    res.json(withCounts);
  } catch (err) { req.log.error({ err }, "land/plots GET error"); res.status(500).json({ error: "Failed to fetch plots" }); }
});

router.get("/land/plots/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.select().from(landPlots).where(eq(landPlots.id, id));
    if (!row) { res.status(404).json({ error: "Plot not found" }); return; }
    const plants = await db.select().from(landPlants).where(eq(landPlants.plotId, id)).orderBy(desc(landPlants.createdAt));
    res.json({ ...row, plants });
  } catch (err) { req.log.error({ err }, "land/plots/:id GET error"); res.status(500).json({ error: "Failed to fetch plot" }); }
});

router.post("/land/plots", async (req, res) => {
  try {
    const { deviceId, name, area, unit, centerLat, centerLon, polygon } = req.body;
    if (!deviceId || !name || !polygon) { res.status(400).json({ error: "deviceId, name, polygon required" }); return; }
    const [plot] = await db.insert(landPlots).values({ deviceId, name, area, unit, centerLat, centerLon, polygon }).returning();
    res.status(201).json(plot);
  } catch (err) { req.log.error({ err }, "land/plots POST error"); res.status(500).json({ error: "Failed to create plot" }); }
});

router.delete("/land/plots/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(landPlots).where(eq(landPlots.id, id));
    res.status(204).end();
  } catch (err) { req.log.error({ err }, "land/plots/:id DELETE error"); res.status(500).json({ error: "Failed to delete plot" }); }
});

// ─── PLANTS ──────────────────────────────────────────────────────────────────────

router.get("/land/plants/:plotId", async (req, res) => {
  try {
    const plotId = parseInt(req.params.plotId, 10);
    const rows = await db.select().from(landPlants).where(eq(landPlants.plotId, plotId)).orderBy(desc(landPlants.createdAt));
    res.json(rows);
  } catch (err) { req.log.error({ err }, "land/plants/:plotId GET error"); res.status(500).json({ error: "Failed to fetch plants" }); }
});

router.get("/land/plants/detail/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [plant] = await db.select().from(landPlants).where(eq(landPlants.id, id));
    if (!plant) { res.status(404).json({ error: "Plant not found" }); return; }
    const followups = await db.select().from(plantFollowups).where(eq(plantFollowups.plantId, id)).orderBy(desc(plantFollowups.createdAt));
    res.json({ ...plant, followups });
  } catch (err) { req.log.error({ err }, "land/plants/detail/:id GET error"); res.status(500).json({ error: "Failed to fetch plant" }); }
});

router.post("/land/plants", async (req, res) => {
  try {
    const { plotId, name, variety, plantX, plantY, healthStatus, photoUri, notes, plantedDate } = req.body;
    if (!plotId || !name || plantX == null || plantY == null) { res.status(400).json({ error: "plotId, name, plantX, plantY required" }); return; }
    const [plant] = await db.insert(landPlants).values({ plotId, name, variety, plantX, plantY, healthStatus, photoUri, notes, plantedDate }).returning();
    res.status(201).json(plant);
  } catch (err) { req.log.error({ err }, "land/plants POST error"); res.status(500).json({ error: "Failed to add plant" }); }
});

router.put("/land/plants/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { healthStatus, notes, photoUri } = req.body;
    const [plant] = await db.update(landPlants).set({ healthStatus, notes, photoUri }).where(eq(landPlants.id, id)).returning();
    if (!plant) { res.status(404).json({ error: "Plant not found" }); return; }
    res.json(plant);
  } catch (err) { req.log.error({ err }, "land/plants/:id PUT error"); res.status(500).json({ error: "Failed to update plant" }); }
});

router.delete("/land/plants/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(landPlants).where(eq(landPlants.id, id));
    res.status(204).end();
  } catch (err) { req.log.error({ err }, "land/plants/:id DELETE error"); res.status(500).json({ error: "Failed to delete plant" }); }
});

// ─── FOLLOW-UPS ──────────────────────────────────────────────────────────────────────

router.get("/land/followups/:plantId", async (req, res) => {
  try {
    const plantId = parseInt(req.params.plantId, 10);
    const rows = await db.select().from(plantFollowups).where(eq(plantFollowups.plantId, plantId)).orderBy(desc(plantFollowups.createdAt));
    res.json(rows);
  } catch (err) { req.log.error({ err }, "land/followups/:plantId GET error"); res.status(500).json({ error: "Failed to fetch followups" }); }
});

router.post("/land/followups", async (req, res) => {
  try {
    const { plantId, action, description, healthStatus, photoUri } = req.body;
    if (!plantId || !action) { res.status(400).json({ error: "plantId and action required" }); return; }
    const [fu] = await db.insert(plantFollowups).values({ plantId, action, description, healthStatus, photoUri }).returning();
    if (healthStatus) {
      await db.update(landPlants).set({ healthStatus }).where(eq(landPlants.id, plantId));
    }
    res.status(201).json(fu);
  } catch (err) { req.log.error({ err }, "land/followups POST error"); res.status(500).json({ error: "Failed to add followup" }); }
});

// ─── AGRO STORES ──────────────────────────────────────────────────────────────────────

router.get("/land/stores", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const category = req.query.category as string | undefined;
    const radiusKm = parseFloat(req.query.radius as string) || 50;
    if (isNaN(lat) || isNaN(lon)) { res.status(400).json({ error: "lat and lon required" }); return; }

    // Haversine formula via SQL
    const distanceExpr = sql<number>`6371 * 2 * asin(sqrt(power(sin((radians(${agroStores.lat}) - radians(${lat})) / 2), 2) + cos(radians(${lat})) * cos(radians(${agroStores.lat})) * power(sin((radians(${agroStores.lon}) - radians(${lon})) / 2), 2)))`.as("distance");

    let q = db.select({
      id: agroStores.id,
      name: agroStores.name,
      category: agroStores.category,
      address: agroStores.address,
      city: agroStores.city,
      country: agroStores.country,
      phone: agroStores.phone,
      lat: agroStores.lat,
      lon: agroStores.lon,
      products: agroStores.products,
      distance: distanceExpr,
    }).from(agroStores);

    const conditions = [sql`${distanceExpr} <= ${radiusKm}`];
    if (category) {
      conditions.push(sql`${agroStores.category} ILIKE ${`%${category}%`}`);
    }
    q = q.where(sql`${conditions.join(" AND ")}`) as typeof q;

    const rows = await q.orderBy(sql`distance`).limit(50);
    res.json(rows);
  } catch (err) { req.log.error({ err }, "land/stores GET error"); res.status(500).json({ error: "Failed to fetch stores" }); }
});

router.post("/land/stores", async (req, res) => {
  try {
    const { name, category, address, city, country, phone, lat, lon, products } = req.body;
    if (!name || !category || !address || !city || lat == null || lon == null) { res.status(400).json({ error: "name, category, address, city, lat, lon required" }); return; }
    const [store] = await db.insert(agroStores).values({ name, category, address, city, country, phone, lat, lon, products }).returning();
    res.status(201).json(store);
  } catch (err) { req.log.error({ err }, "land/stores POST error"); res.status(500).json({ error: "Failed to add store" }); }
});

export default router;
