import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  documentNumber: text("document_number").notNull().unique(),
  phone: text("phone"),
  email: text("email").notNull().unique(),
  apartment: text("apartment"),
  complexId: integer("complex_id"),
  role: text("role").notNull().default("resident"), // 'admin' | 'resident'
  status: text("status").notNull().default("active"), // 'active' | 'inactive'
  passwordHash: text("password_hash").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
