/**
 * Copies the built-in content (content/mn.ts, content/en.ts, defaultContactInfo)
 * into the ContentSection table. Only fills sections that are missing, so it never
 * overwrites admin edits; pass --force to reset every section to the built-in text.
 *
 * Usage: npm run db:seed-content [-- --force]
 */
import { db, run } from "./db";
import { en } from "../content/en";
import { mn } from "../content/mn";
import { defaultContactInfo } from "../content/common";
import { sectionKeys } from "../content/schema";

const force = process.argv.includes("--force");

run(async () => {
  const rows = [
    ...sectionKeys.flatMap((key) => [
      { key, locale: "mn", data: mn[key] },
      { key, locale: "en", data: en[key] },
    ]),
    { key: "contact", locale: "all", data: defaultContactInfo },
  ];

  let written = 0;
  for (const { key, locale, data } of rows) {
    const where = { key_locale: { key, locale } };
    if (!force && (await db.contentSection.findUnique({ where }))) continue;
    await db.contentSection.upsert({
      where,
      create: { key, locale, data, updatedBy: "seed" },
      update: { data, updatedBy: "seed" },
    });
    written++;
  }
  console.log(`Content sections written: ${written} of ${rows.length}${force ? " (forced)" : ""}`);
});
