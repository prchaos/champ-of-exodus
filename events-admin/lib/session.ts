import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import type { NextRequest, NextResponse } from "next/server";

// 15-minute inactivity limit (spec requirement). The cookie's own maxAge
// doubles as a hard backstop; the real sliding-window enforcement happens
// server-side in middleware.ts via lastActivityAt, never trusting the
// client-side idle timer alone.
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const PENDING_TIMEOUT_SECONDS = 5 * 60;

export interface SessionData {
  adminId: string;
  username: string;
  issuedAt: number;
  lastActivityAt: number;
}

// Short-lived cookie used only between "password checked" and "MFA
// confirmed" — carries no authorization, just enough to resume the login
// flow, and never grants /dashboard access on its own.
export interface PendingData {
  adminId: string;
  stage: "enroll" | "verify";
  totpSecret?: string;
}

function requireSecret(name: "SESSION_SECRET"): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to a string of at least 32 characters`);
  }
  return value;
}

const baseCookieOptions = {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax" as const,
};

// Built lazily (not as module-scope constants) so importing this module —
// which Next.js does while statically analyzing every page at build time,
// including ones that never end up calling these — doesn't require
// SESSION_SECRET to be present in the build environment. It only needs to
// exist at request time.
function getSessionOptions() {
  return {
    password: requireSecret("SESSION_SECRET"),
    cookieName: "events_admin_session",
    cookieOptions: { ...baseCookieOptions, maxAge: IDLE_TIMEOUT_MS / 1000 },
  };
}

function getPendingSessionOptions() {
  return {
    password: requireSecret("SESSION_SECRET"),
    cookieName: "events_admin_pending",
    cookieOptions: { ...baseCookieOptions, maxAge: PENDING_TIMEOUT_SECONDS },
  };
}

/** For Server Components, Server Actions, and Route Handlers. */
export async function getSession() {
  return getIronSession<SessionData>(cookies(), getSessionOptions());
}

export async function getPendingSession() {
  return getIronSession<PendingData>(cookies(), getPendingSessionOptions());
}

/** For middleware.ts (edge runtime), which reads/writes cookies via request/response instead of next/headers. */
export async function getSessionForMiddleware(request: NextRequest, response: NextResponse) {
  return getIronSession<SessionData>(request, response, getSessionOptions());
}

/**
 * Returns the current session only if it exists and hasn't gone idle. This is
 * the server-side source of truth for "is this admin still logged in". Read-only
 * on purpose: it's called from Server Components, where cookies can't be
 * modified — middleware.ts clears idle sessions on the next /dashboard request.
 */
export async function getValidSession(): Promise<IronSession<SessionData> | null> {
  const session = await getSession();
  if (!session.adminId) return null;
  if (Date.now() - session.lastActivityAt > IDLE_TIMEOUT_MS) return null;
  return session;
}

export async function establishSession(adminId: string, username: string): Promise<void> {
  const session = await getSession();
  session.adminId = adminId;
  session.username = username;
  session.issuedAt = Date.now();
  session.lastActivityAt = Date.now();
  await session.save();

  const pending = await getPendingSession();
  pending.destroy();
  await pending.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
  await session.save();
}
