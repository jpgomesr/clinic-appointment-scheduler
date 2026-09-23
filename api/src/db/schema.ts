import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
   id: uuid("id").primaryKey().defaultRandom(),
   name: varchar("name", { length: 255 }).notNull(),
   email: varchar("email", { length: 255 }).notNull().unique(),
   password: varchar("password", { length: 255 }).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   deletedAt: timestamp("deleted_at"),
});

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
