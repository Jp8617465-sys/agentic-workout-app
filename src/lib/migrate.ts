import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db, expoDb } from "./database";
import { runCustomMigrations } from "./custom-migrations";

const migrations = {
  journal: {
    entries: [
      {
        idx: 0,
        when: 1772584166350,
        tag: "0000_light_ghost_rider",
        breakpoints: true,
      },
      {
        idx: 1,
        when: 1772670000000,
        tag: "0001_intelligence_layer",
        breakpoints: true,
      },
    ],
  },
  migrations: {
    "0001_intelligence_layer": `CREATE TABLE \`personal_records\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`user_id\` text NOT NULL,\n\t\`exercise_name\` text NOT NULL,\n\t\`weight\` real NOT NULL,\n\t\`reps\` integer NOT NULL,\n\t\`estimated_one_rep_max\` real NOT NULL,\n\t\`achieved_at\` text NOT NULL,\n\t\`workout_id\` text NOT NULL,\n\t\`created_at\` text NOT NULL,\n\tFOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (\`exercise_name\`) REFERENCES \`exercises\`(\`name\`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (\`workout_id\`) REFERENCES \`workouts\`(\`id\`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX \`idx_pr_user_exercise\` ON \`personal_records\` (\`user_id\`,\`exercise_name\`);\n--> statement-breakpoint\nCREATE TABLE \`ai_cache\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`user_id\` text NOT NULL,\n\t\`cache_key\` text NOT NULL,\n\t\`response\` text NOT NULL,\n\t\`expires_at\` integer NOT NULL,\n\t\`created_at\` text NOT NULL\n);\n--> statement-breakpoint\nCREATE INDEX \`idx_ai_cache_key\` ON \`ai_cache\` (\`user_id\`,\`cache_key\`);`,
    "0000_light_ghost_rider": `CREATE TABLE \`exercise_performances\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`workout_id\` text NOT NULL,\n\t\`exercise_name\` text NOT NULL,\n\t\`prescribed_sets\` integer,\n\t\`prescribed_reps\` integer,\n\t\`prescribed_weight\` real,\n\t\`prescribed_rpe\` real,\n\t\`prescribed_rest_seconds\` integer,\n\t\`actual_sets\` integer,\n\t\`actual_average_rpe\` real,\n\t\`order_in_workout\` integer DEFAULT 0 NOT NULL,\n\tFOREIGN KEY (\`workout_id\`) REFERENCES \`workouts\`(\`id\`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (\`exercise_name\`) REFERENCES \`exercises\`(\`name\`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX \`idx_ep_workout\` ON \`exercise_performances\` (\`workout_id\`);\n--> statement-breakpoint\nCREATE TABLE \`exercises\` (\n\t\`name\` text PRIMARY KEY NOT NULL,\n\t\`category\` text NOT NULL,\n\t\`pattern\` text NOT NULL,\n\t\`equipment\` text DEFAULT '[]' NOT NULL,\n\t\`muscle_groups\` text DEFAULT '[]' NOT NULL,\n\t\`default_tempo\` text DEFAULT '3010',\n\t\`default_rest_seconds\` integer DEFAULT 120,\n\t\`instructions\` text DEFAULT '[]' NOT NULL,\n\t\`cues\` text DEFAULT '[]' NOT NULL,\n\t\`common_mistakes\` text DEFAULT '[]' NOT NULL,\n\t\`variations\` text DEFAULT '[]' NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE \`injuries\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`user_id\` text NOT NULL,\n\t\`type\` text NOT NULL,\n\t\`status\` text DEFAULT 'acute' NOT NULL,\n\t\`severity\` integer DEFAULT 5 NOT NULL,\n\t\`date_occurred\` text NOT NULL,\n\t\`notes\` text,\n\t\`created_at\` text NOT NULL,\n\t\`updated_at\` text NOT NULL,\n\tFOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE TABLE \`injury_risks\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`exercise_name\` text NOT NULL,\n\t\`injury_type\` text NOT NULL,\n\t\`risk_level\` text NOT NULL,\n\t\`contraindications\` text DEFAULT '[]' NOT NULL,\n\t\`modifications\` text DEFAULT '[]' NOT NULL,\n\tFOREIGN KEY (\`exercise_name\`) REFERENCES \`exercises\`(\`name\`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE TABLE \`set_logs\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`exercise_performance_id\` text NOT NULL,\n\t\`set_number\` integer NOT NULL,\n\t\`weight\` real,\n\t\`reps\` integer,\n\t\`rpe\` real,\n\t\`type\` text DEFAULT 'working' NOT NULL,\n\t\`rest_time_used\` integer,\n\t\`completed_at\` text,\n\t\`sync_status\` text DEFAULT 'pending' NOT NULL,\n\tFOREIGN KEY (\`exercise_performance_id\`) REFERENCES \`exercise_performances\`(\`id\`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX \`idx_set_logs_ep\` ON \`set_logs\` (\`exercise_performance_id\`);\n--> statement-breakpoint\nCREATE TABLE \`users\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`name\` text NOT NULL,\n\t\`email\` text,\n\t\`experience_level\` text DEFAULT 'beginner' NOT NULL,\n\t\`training_goal\` text DEFAULT 'general_fitness' NOT NULL,\n\t\`unit_system\` text DEFAULT 'metric' NOT NULL,\n\t\`sync_status\` text DEFAULT 'pending' NOT NULL,\n\t\`created_at\` text NOT NULL,\n\t\`updated_at\` text NOT NULL,\n\t\`deleted_at\` text\n);\n--> statement-breakpoint\nCREATE TABLE \`workouts\` (\n\t\`id\` text PRIMARY KEY NOT NULL,\n\t\`user_id\` text NOT NULL,\n\t\`date\` text NOT NULL,\n\t\`type\` text DEFAULT 'custom' NOT NULL,\n\t\`status\` text DEFAULT 'active' NOT NULL,\n\t\`duration_minutes\` integer,\n\t\`total_volume\` real,\n\t\`average_rpe\` real,\n\t\`rest_timer_ends_at\` integer,\n\t\`sync_status\` text DEFAULT 'pending' NOT NULL,\n\t\`created_at\` text NOT NULL,\n\t\`updated_at\` text NOT NULL,\n\tFOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX \`idx_workouts_user_date\` ON \`workouts\` (\`user_id\`,\`date\`);`,
  },
};

export function useDatabaseMigrations() {
  const result = useMigrations(db, migrations);

  if (result.success) {
    runCustomMigrations(expoDb);
  }

  return result;
}
