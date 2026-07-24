import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull(),
  complexId: integer("complex_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  hour: text("hour").notNull(),
  responsiblePerson: text("responsible_person").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'completed' | 'cancelled'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
