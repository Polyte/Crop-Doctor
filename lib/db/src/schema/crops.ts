import { integer, pgTable, real, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  variety: text("variety"),
  category: text("category").notNull(), // e.g. "Cereals", "Vegetables", "Fruits", "Legumes"
  family: text("family"), // e.g. "Solanaceae", "Poaceae"
  daysToMaturity: integer("days_to_maturity"),
  daysToGermination: integer("days_to_germination"),
  spacingCm: integer("spacing_cm"), // plant spacing in cm
  rowSpacingCm: integer("row_spacing_cm"), // row spacing in cm
  optimalTempMin: real("optimal_temp_min"),
  optimalTempMax: real("optimal_temp_max"),
  soilPhMin: real("soil_ph_min"),
  soilPhMax: real("soil_ph_max"),
  waterNeeds: text("water_needs"), // "low", "medium", "high"
  sunNeeds: text("sun_needs"), // "full", "partial", "shade"
  seasons: text("seasons").notNull(), // JSON array of seasons: ["spring", "summer", "autumn", "winter"]
  regions: text("regions").notNull(), // JSON array of regions where common
  plantingDepthCm: real("planting_depth_cm"),
  harvestWindow: text("harvest_window"), // e.g. "2-3 weeks"
  companionPlants: text("companion_plants"), // JSON array
  commonPests: text("common_pests"), // JSON array
  description: text("description"),
  imageUrl: text("image_url"),
});

export const insertCropSchema = createInsertSchema(crops).omit({ id: true });
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;
