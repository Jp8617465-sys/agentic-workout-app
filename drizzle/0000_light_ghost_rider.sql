CREATE TABLE `exercise_performances` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_name` text NOT NULL,
	`prescribed_sets` integer,
	`prescribed_reps` integer,
	`prescribed_weight` real,
	`prescribed_rpe` real,
	`prescribed_rest_seconds` integer,
	`actual_sets` integer,
	`actual_average_rpe` real,
	`order_in_workout` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_name`) REFERENCES `exercises`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ep_workout` ON `exercise_performances` (`workout_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`name` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`pattern` text NOT NULL,
	`equipment` text DEFAULT '[]' NOT NULL,
	`muscle_groups` text DEFAULT '[]' NOT NULL,
	`default_tempo` text DEFAULT '3010',
	`default_rest_seconds` integer DEFAULT 120,
	`instructions` text DEFAULT '[]' NOT NULL,
	`cues` text DEFAULT '[]' NOT NULL,
	`common_mistakes` text DEFAULT '[]' NOT NULL,
	`variations` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `injuries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'acute' NOT NULL,
	`severity` integer DEFAULT 5 NOT NULL,
	`date_occurred` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `injury_risks` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_name` text NOT NULL,
	`injury_type` text NOT NULL,
	`risk_level` text NOT NULL,
	`contraindications` text DEFAULT '[]' NOT NULL,
	`modifications` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`exercise_name`) REFERENCES `exercises`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `set_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_performance_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real,
	`reps` integer,
	`rpe` real,
	`type` text DEFAULT 'working' NOT NULL,
	`rest_time_used` integer,
	`completed_at` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`exercise_performance_id`) REFERENCES `exercise_performances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_set_logs_ep` ON `set_logs` (`exercise_performance_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`experience_level` text DEFAULT 'beginner' NOT NULL,
	`training_goal` text DEFAULT 'general_fitness' NOT NULL,
	`unit_system` text DEFAULT 'metric' NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`duration_minutes` integer,
	`total_volume` real,
	`average_rpe` real,
	`rest_timer_ends_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workouts_user_date` ON `workouts` (`user_id`,`date`);