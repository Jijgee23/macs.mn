/**
 * Creates (or resets the password of) an admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Safe to re-run. Further admins are added from /admin/users.
 *
 * Usage: npm run db:seed-admin
 */
import bcrypt from "bcryptjs";
import { db, run } from "./db";

run(async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
  console.log(`Admin user ready: ${user.email}`);
});
