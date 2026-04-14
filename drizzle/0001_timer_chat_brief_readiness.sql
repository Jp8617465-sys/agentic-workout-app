-- Migration 0001: rest timer suggestions, AI chat, daily briefs, readiness logs
-- Generated manually (drizzle-kit not available in CI environment)

-- Add active rest suggestions to exercises table
ALTER TABLE `exercises` ADD COLUMN `active_rest_suggestions` text NOT NULL DEFAULT '[]';

-- AI coaching chat messages
-- No context_snapshot column — context reconstructed from last N rows at query time
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `idx_chat_messages_user` ON `chat_messages` (`user_id`, `created_at`);

-- Daily workout briefs cached per user per day
CREATE TABLE `daily_briefs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`session_type` text NOT NULL,
	`estimated_duration_minutes` integer,
	`phase` text,
	`week_number` integer,
	`exercises` text NOT NULL DEFAULT '[]',
	`source` text NOT NULL DEFAULT 'deterministic',
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX `idx_daily_briefs_user_date` ON `daily_briefs` (`user_id`, `date`);

-- Pre-session readiness check-ins (1=low, 2=medium, 3=high)
CREATE TABLE `readiness_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`energy` integer NOT NULL,
	`soreness` integer NOT NULL,
	`motivation` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `idx_readiness_user_date` ON `readiness_logs` (`user_id`, `date`);
