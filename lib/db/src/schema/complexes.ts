import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complexesTable = pgTable("complexes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull(),
  administrator: text("administrator"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("active"), // 'active' | 'inactive'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertComplexSchema = createInsertSchema(complexesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplex = z.infer<typeof insertComplexSchema>;
export type Complex = typeof complexesTable.$inferSelect;
