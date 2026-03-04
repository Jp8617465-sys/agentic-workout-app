import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "intelligent_trainer.db";

const expoDb = openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true,
});

expoDb.execSync("PRAGMA journal_mode = WAL");
expoDb.execSync("PRAGMA foreign_keys = ON");
expoDb.execSync("PRAGMA cache_size = -8000");

export const db = drizzle(expoDb, { schema });

export { expoDb };
