import { pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agroStores = pgTable("agro_stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // seeds, fertilizers, pesticides, tools, general
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  phone: text("phone"),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  products: text("products"), // comma-separated list of products
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAgroStoreSchema = createInsertSchema(agroStores).omit({ id: true, createdAt: true });
export type InsertAgroStore = z.infer<typeof insertAgroStoreSchema>;
export type AgroStore = typeof agroStores.$inferSelect;
