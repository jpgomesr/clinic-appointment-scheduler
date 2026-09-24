import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "../shared/logger/logger";

async function main() {
   const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
   });
   const db = drizzle(pool);

   await migrate(db, { migrationsFolder: "./drizzle" });

   await pool.end();
}

main().catch((err) => {
   logger.error(err);
   process.exit(1);
});
