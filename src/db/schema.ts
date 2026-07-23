import { pgTable, text, boolean, integer, unique } from "drizzle-orm/pg-core"

export const blocks = pgTable("blocks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  categoryId: text("category_id").notNull(),
  color: text("color"),
  completed: boolean("completed").default(false).notNull(),
  missed: boolean("missed").default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  recurring: boolean("recurring").default(false),
  recurringPattern: text("recurring_pattern"),
  recurringStartDate: text("recurring_start_date"),
  recurringEndDate: text("recurring_end_date"),
  recurringGroupId: text("recurring_group_id"),
})

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  order: integer("order").notNull(),
})

export const focusSessions = pgTable("focus_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  blockId: text("block_id").notNull(),
  date: text("date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  completedAt: text("completed_at").notNull(),
})

export const habits = pgTable("habits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  frequency: text("frequency").notNull(),
  order: integer("order").notNull(),
  createdAt: text("created_at").notNull(),
})

export const habitRecords = pgTable("habit_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  habitId: text("habit_id").notNull(),
  date: text("date").notNull(),
  completedAt: text("completed_at").notNull(),
})

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  dayStart: text("day_start").default("08:00").notNull(),
  dayEnd: text("day_end").default("18:00").notNull(),
  defaultTimer: integer("default_timer").default(25).notNull(),
  breakDuration: integer("break_duration").default(5).notNull(),
  weekStart: integer("week_start").default(1).notNull(),
  theme: text("theme").default("dark").notNull(),
})
