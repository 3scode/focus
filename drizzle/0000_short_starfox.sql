CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"category_id" text NOT NULL,
	"color" text,
	"completed" boolean DEFAULT false NOT NULL,
	"missed" boolean DEFAULT false,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"recurring" boolean DEFAULT false,
	"recurring_pattern" text,
	"recurring_start_date" text,
	"recurring_end_date" text,
	"recurring_group_id" text
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"block_id" text NOT NULL,
	"date" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"completed_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" text NOT NULL,
	"date" text NOT NULL,
	"completed_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"frequency" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day_start" text DEFAULT '08:00' NOT NULL,
	"day_end" text DEFAULT '18:00' NOT NULL,
	"default_timer" integer DEFAULT 25 NOT NULL,
	"break_duration" integer DEFAULT 5 NOT NULL,
	"week_start" integer DEFAULT 1 NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	CONSTRAINT "settings_user_id_unique" UNIQUE("user_id")
);
