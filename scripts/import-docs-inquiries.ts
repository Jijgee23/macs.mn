/**
 * One-off move of quote requests and contact messages from the docs site's database
 * (where macs.mn used to send them) into this one. Keeps ids, so re-running skips
 * rows already copied.
 *
 * Usage: DOCS_DATABASE_URL=postgresql://… npm run db:import-docs-inquiries
 */
import { Client } from "pg";
import { db, run } from "./db";

run(async () => {
  const url = process.env.DOCS_DATABASE_URL;
  if (!url) throw new Error("DOCS_DATABASE_URL must be set");

  const docs = new Client({ connectionString: url });
  await docs.connect();
  try {
    const quotes = (await docs.query('SELECT * FROM "QuoteRequest"')).rows;
    const contacts = (await docs.query('SELECT * FROM "ContactMessage"')).rows;

    const q = await db.quoteRequest.createMany({ data: quotes, skipDuplicates: true });
    const c = await db.contactMessage.createMany({ data: contacts, skipDuplicates: true });

    console.log(`QuoteRequest: ${q.count} copied of ${quotes.length}`);
    console.log(`ContactMessage: ${c.count} copied of ${contacts.length}`);
  } finally {
    await docs.end();
  }
});
