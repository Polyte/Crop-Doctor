import { db, farmers, marketListings, insertFarmerSchema, insertListingSchema } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

// GET all available listings (buyer view — flat join with farmer info)
router.get("/market/listings", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: marketListings.id,
        farmerId: marketListings.farmerId,
        productName: marketListings.productName,
        category: marketListings.category,
        price: marketListings.price,
        unit: marketListings.unit,
        quantity: marketListings.quantity,
        description: marketListings.description,
        available: marketListings.available,
        createdAt: marketListings.createdAt,
        farmerName: farmers.name,
        farmName: farmers.farmName,
        farmerLocation: farmers.location,
        farmerPhone: farmers.phone,
      })
      .from(marketListings)
      .leftJoin(farmers, eq(marketListings.farmerId, farmers.id))
      .where(eq(marketListings.available, true))
      .orderBy(desc(marketListings.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "market/listings GET error");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET single listing with farmer info
router.get("/market/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db
      .select({
        id: marketListings.id,
        farmerId: marketListings.farmerId,
        productName: marketListings.productName,
        category: marketListings.category,
        price: marketListings.price,
        unit: marketListings.unit,
        quantity: marketListings.quantity,
        description: marketListings.description,
        available: marketListings.available,
        createdAt: marketListings.createdAt,
        farmerName: farmers.name,
        farmName: farmers.farmName,
        farmerLocation: farmers.location,
        farmerPhone: farmers.phone,
      })
      .from(marketListings)
      .leftJoin(farmers, eq(marketListings.farmerId, farmers.id))
      .where(eq(marketListings.id, id));
    if (!row) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "market/listings/:id GET error");
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// GET farmer by deviceId (used to check registration status on app launch)
router.get("/market/farmers/by-device/:deviceId", async (req, res) => {
  try {
    const [farmer] = await db
      .select()
      .from(farmers)
      .where(eq(farmers.deviceId, req.params.deviceId));
    if (!farmer) {
      res.status(404).json({ error: "Not registered" });
      return;
    }
    res.json(farmer);
  } catch (err) {
    req.log.error({ err }, "market/farmers/by-device GET error");
    res.status(500).json({ error: "Failed to fetch farmer" });
  }
});

// GET farmer's own listings (dashboard — all, including unavailable)
router.get("/market/farmers/:id/listings", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id, 10);
    const rows = await db
      .select()
      .from(marketListings)
      .where(eq(marketListings.farmerId, farmerId))
      .orderBy(desc(marketListings.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "market/farmers/:id/listings GET error");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// POST register or update farmer (upsert by deviceId)
router.post("/market/farmers", async (req, res) => {
  try {
    const parsed = insertFarmerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    const { deviceId, name, farmName, location, phone, bio } = parsed.data;
    const [farmer] = await db
      .insert(farmers)
      .values(parsed.data)
      .onConflictDoUpdate({
        target: farmers.deviceId,
        set: { name, farmName, location, phone, bio },
      })
      .returning();
    res.status(201).json(farmer);
  } catch (err) {
    req.log.error({ err }, "market/farmers POST error");
    res.status(500).json({ error: "Failed to register farmer" });
  }
});

// POST create listing
router.post("/market/listings", async (req, res) => {
  try {
    const parsed = insertListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    const [listing] = await db.insert(marketListings).values(parsed.data).returning();
    res.status(201).json(listing);
  } catch (err) {
    req.log.error({ err }, "market/listings POST error");
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// PUT update listing (partial update — used for edits and toggling availability)
router.put("/market/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = insertListingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    const [listing] = await db
      .update(marketListings)
      .set(parsed.data)
      .where(eq(marketListings.id, id))
      .returning();
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json(listing);
  } catch (err) {
    req.log.error({ err }, "market/listings/:id PUT error");
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// DELETE listing
router.delete("/market/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(marketListings).where(eq(marketListings.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "market/listings/:id DELETE error");
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

export default router;
