import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userFullName: text("user_full_name").notNull(),
  action: text("action").notNull(),   // 'login' | 'create' | 'update' | 'delete'
  resource: text("resource").notNull(), // 'user' | 'complex' | 'material' | 'event' | 'record'
  resourceId: integer("resource_id"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
