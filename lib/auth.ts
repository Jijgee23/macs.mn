import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getIronSession, type SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/** Must match the cookie name checked in proxy.ts. */
export const SESSION_COOKIE = "macs_site_admin_session";

/** "Remember me": the seal and cookie last 30 days. */
const REMEMBER_TTL = 30 * 24 * 60 * 60;
/** Otherwise: a browser-session cookie whose seal expires after 12 hours anyway. */
const SHORT_TTL = 12 * 60 * 60;

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
    ttl: REMEMBER_TTL,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  };
}

export async function getSession() {
  // iron-session checks the seal's expiry with Date.now(); connection() keeps this
  // request-time so Cache Components doesn't try to prerender it.
  await connection();
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions());
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}

/** Signs an admin in. Without `remember` the cookie is dropped when the browser closes. */
export async function startSession(user: { id: string; email: string }, remember: boolean) {
  const session = await getSession();
  const base = sessionOptions();
  session.updateConfig(
    remember
      ? base
      : { ...base, ttl: SHORT_TTL, cookieOptions: { ...base.cookieOptions, maxAge: undefined } },
  );
  session.userId = user.id;
  session.email = user.email;
  session.isLoggedIn = true;
  await session.save();
}

/** The logged-in admin, or null. For pages that shouldn't redirect (e.g. the login page). */
export async function currentAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;
  return db.adminUser.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true } });
}

/**
 * DAL check — call at the top of every admin page and Server Action, not just in
 * proxy.ts. Also confirms the account still exists, so a deleted admin's cookie
 * stops working immediately.
 */
export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

/** Where to go after login: only admin pages on this site, never an open redirect. */
export function safeNext(next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) {
    return "/admin";
  }
  return next.startsWith("/admin/login") ? "/admin" : next;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
