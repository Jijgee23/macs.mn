import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "macs_site_admin_session";

export interface SessionData {
  userId?: string;
  email?: string;
  isLoggedIn: boolean;
}

const defaultSession: SessionData = { isLoggedIn: false };

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
    Object.assign(session, defaultSession);
  }
  return session;
}

/** DAL check — call this at the top of every admin Server Action / page, not just in proxy.ts. */
export async function requireAdmin(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    redirect("/admin/login");
  }
  return session;
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
