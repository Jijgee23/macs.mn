import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/** Must match the cookie name checked in proxy.ts. */
export const SESSION_COOKIE = "macs_site_admin_session";

export interface SessionData {
  userId?: string;
  email?: string;
  isLoggedIn: boolean;
}

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return {
    password,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  };
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions());
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}

/**
 * DAL check — call at the top of every admin page and Server Action, not just in
 * proxy.ts. Also confirms the account still exists, so a deleted admin's cookie
 * stops working immediately.
 */
export async function requireAdmin() {
  const session = await getSession();
  const user =
    session.isLoggedIn && session.userId
      ? await db.adminUser.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true } })
      : null;
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
