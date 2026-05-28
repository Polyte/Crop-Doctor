import { integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landPlots = pgTable("land_plots", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  name: text("name").notNull(),
  area: real("area"),
  unit: text("unit").default("m²").notNull(),
  centerLat: real("center_lat"),
  centerLon: real("center_lon"),
  polygon: text("polygon").notNull(), // JSON string of [{x,y},...] normalized 0-1
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLandPlotSchema = createInsertSchema(landPlots).omit({ id: true, createdAt: true });
export type InsertLandPlot = z.infer<typeof insertLandPlotSchema>;
export type LandPlot = typeof landPlots.$inferSelect;
