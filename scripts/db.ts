/** Shared Prisma client for CLI scripts (Next.js isn't running, so load .env ourselves). */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: [".env.local", ".env"], quiet: true });

export const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

export async function run(main: () => Promise<void>) {
  try {
    await main();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
