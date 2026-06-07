import { db, diseaseReports } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/community/reports", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusKm = parseFloat(req.query.radius as string) || 100;

    if (isNaN(lat) || isNaN(lon)) {
      const rows = await db.select().from(diseaseReports).orderBy(desc(diseaseReports.createdAt)).limit(50);
      res.json(rows);
      return;
    }

    const distanceExpr = sql<number>`6371 * 2 * asin(sqrt(power(sin((radians(${diseaseReports.lat}) - radians(${lat})) / 2), 2) + cos(radians(${lat})) * cos(radians(${diseaseReports.lat})) * power(sin((radians(${diseaseReports.lon}) - radians(${lon})) / 2), 2)))`;

    const rows = await db.select({
      id: diseaseReports.id,
      deviceId: diseaseReports.deviceId,
      lat: diseaseReports.lat,
      lon: diseaseReports.lon,
      cropName: diseaseReports.cropName,
      disease: diseaseReports.disease,
      severity: diseaseReports.severity,
      description: diseaseReports.description,
      createdAt: diseaseReports.createdAt,
      distance: distanceExpr.as("distance"),
    })
      .from(diseaseReports)
      .where(sql`${distanceExpr} <= ${radiusKm}`)
      .orderBy(desc(diseaseReports.createdAt))
      .limit(100);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "community/reports GET error");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/community/reports", async (req, res) => {
  try {
    const { deviceId, lat, lon, cropName, disease, severity, description } = req.body;
    if (!deviceId || lat == null || lon == null || !cropName || !disease) {
      res.status(400).json({ error: "deviceId, lat, lon, cropName, disease required" });
      return;
    }
    const [report] = await db.insert(diseaseReports).values({ deviceId, lat, lon, cropName, disease, severity: severity ?? "medium", description }).returning();
    res.status(201).json(report);
  } catch (err) {
    req.log.error({ err }, "community/reports POST error");
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
