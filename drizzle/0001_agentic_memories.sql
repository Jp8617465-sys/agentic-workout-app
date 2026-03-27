CREATE TABLE IF NOT EXISTS `agentic_memories` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `type` text NOT NULL DEFAULT 'pattern',
  `description` text NOT NULL,
  `context` text NOT NULL DEFAULT '{}',
  `observations` integer NOT NULL DEFAULT 1,
  `success_rate` real NOT NULL DEFAULT 0,
  `first_observed` text NOT NULL,
  `last_observed` text NOT NULL,
  `trigger` text NOT NULL DEFAULT '',
  `action` text NOT NULL DEFAULT '',
  `confidence` real NOT NULL DEFAULT 0,
  `reinforced` integer NOT NULL DEFAULT 0,
  `applied_successfully` integer NOT NULL DEFAULT 0,
  `applied_unsuccessfully` integer NOT NULL DEFAULT 0,
  `last_applied` text,
  `sync_status` text NOT NULL DEFAULT 'pending',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_memories_user_confidence` ON `agentic_memories` (`user_id`, `confidence` DESC);
CREATE INDEX IF NOT EXISTS `idx_memories_user_type` ON `agentic_memories` (`user_id`, `type`);
