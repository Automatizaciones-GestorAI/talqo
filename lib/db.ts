import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.warn("[talqo] Falta DATABASE_URL en las variables de entorno.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
