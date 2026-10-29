import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local first, so the CLI does the same.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Not env(): `prisma generate` (postinstall) must work before .env exists.
    url: process.env.DATABASE_URL ?? "",
  },
});
