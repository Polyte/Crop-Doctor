import { pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diseaseReports = pgTable("disease_reports", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  cropName: text("crop_name").notNull(),
  disease: text("disease").notNull(),
  severity: text("severity").notNull().default("medium"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDiseaseReportSchema = createInsertSchema(diseaseReports).omit({ id: true, createdAt: true });
export type InsertDiseaseReport = z.infer<typeof insertDiseaseReportSchema>;
export type DiseaseReport = typeof diseaseReports.$inferSelect;
