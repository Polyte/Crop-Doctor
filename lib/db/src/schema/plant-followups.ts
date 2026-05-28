import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { landPlants } from "./land-plants";

export const plantFollowups = pgTable("plant_followups", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .references(() => landPlants.id, { onDelete: "cascade" })
    .notNull(),
  action: text("action").notNull(), // e.g. fertilized, sprayed, pruned, checked
  description: text("description"),
  healthStatus: text("health_status").default("healthy").notNull(),
  photoUri: text("photo_uri"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPlantFollowupSchema = createInsertSchema(plantFollowups).omit({ id: true, createdAt: true });
export type InsertPlantFollowup = z.infer<typeof insertPlantFollowupSchema>;
export type PlantFollowup = typeof plantFollowups.$inferSelect;
