import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "../config/env";
import { logger } from "../shared/logger/logger";

export const pool = new Pool({
   connectionString: env.DATABASE_URL,
   connectionTimeoutMillis: 5000,
});

// clientes ociosos do pool podem emitir 'error' fora de qualquer query;
// sem listener isso derruba o processo com uma uncaught exception
pool.on("error", (err) => {
   logger.error({ err }, "Erro inesperado no pool do Postgres");
});

export const db = drizzle(pool, { schema });
