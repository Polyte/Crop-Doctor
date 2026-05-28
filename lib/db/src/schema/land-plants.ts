import { boolean, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { landPlots } from "./land-plots";

export const landPlants = pgTable("land_plants", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id")
    .references(() => landPlots.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  variety: text("variety"),
  plantX: real("plant_x").notNull(), // normalized 0-1 within plot
  plantY: real("plant_y").notNull(),
  healthStatus: text("health_status").default("healthy").notNull(), // healthy, warning, sick, recovering
  photoUri: text("photo_uri"),
  notes: text("notes"),
  plantedDate: text("planted_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLandPlantSchema = createInsertSchema(landPlants).omit({ id: true, createdAt: true });
export type InsertLandPlant = z.infer<typeof insertLandPlantSchema>;
export type LandPlant = typeof landPlants.$inferSelect;
