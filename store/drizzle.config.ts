import { defineConfig } from "drizzle-kit";

// drizzle-kit no lee .dev.vars por sí solo
try {
  process.loadEnvFile(".dev.vars");
} catch {}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
