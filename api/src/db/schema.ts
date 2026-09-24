import { pgTable, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
   "users",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      password: varchar("password", { length: 255 }).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      deletedAt: timestamp("deleted_at"),
   },
   (table) => [
      uniqueIndex("users_email_active_unique")
         .on(table.email)
         .where(sql`${table.deletedAt} IS NULL`),
   ],
);

export const professionals = pgTable("professionals", {
   id: uuid("id").primaryKey().defaultRandom(),
   name: varchar("name", { length: 255 }).notNull(),
});

export const appointments = pgTable("appointments", {
   id: uuid("id").primaryKey().defaultRandom(),
   startAt: timestamp("start_at").notNull(),
   endAt: timestamp("end_at").notNull(),
   professionalId: uuid("professional_id")
      .references(() => professionals.id)
      .notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   deletedAt: timestamp("deleted_at"),
});
