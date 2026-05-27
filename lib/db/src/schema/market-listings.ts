import { boolean, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmers } from "./farmers";

export const marketListings = pgTable("market_listings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .references(() => farmers.id, { onDelete: "cascade" })
    .notNull(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull(),
  description: text("description"),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(marketListings).omit({ id: true, createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type MarketListing = typeof marketListings.$inferSelect;
