import { pgTable, text, serial, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recyclingRecordsTable = pgTable("recycling_records", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull(),
  complexId: integer("complex_id").notNull(),
  materialId: integer("material_id").notNull(),
  weightKg: numeric("weight_kg", { precision: 10, scale: 3 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  observation: text("observation"),
  responsibleUserId: integer("responsible_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecyclingRecordSchema = createInsertSchema(recyclingRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecyclingRecord = z.infer<typeof insertRecyclingRecordSchema>;
export type RecyclingRecord = typeof recyclingRecordsTable.$inferSelect;
