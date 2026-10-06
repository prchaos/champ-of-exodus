"use server";

import { redirect } from "next/navigation";

import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { verifyPassword } from "@/lib/auth/password";
import { getClientIp, isRateLimited, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { generateTotpSecret, verifyTotpToken } from "@/lib/auth/totp";
import { writeAuditLog } from "@/lib/audit";
import { adminPrisma } from "@/lib/prisma/admin-client";
import { destroySession, establishSession, getPendingSession, getSession } from "@/lib/session";
import { loginSchema, totpCodeSchema } from "@/lib/validations/auth";

export interface ActionResult {
  error?: string;
}

export interface LoginResult extends ActionResult {
  next?: "enroll" | "verify";
}

/**
 * Checks username/password only. On success, starts the MFA leg of login
 * (enrollment for a first-time admin, verification otherwise) via a
 * short-lived pending cookie — never establishes a full session by itself.
 */
export async function login(values: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter a username and password" };
  }
  const { username, password } = parsed.data;
  const ip = getClientIp();

  if (await isRateLimited(username, ip)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const admin = await adminPrisma.adminUser.findUnique({ where: { username } });
  const passwordOk = admin ? await verifyPassword(password, admin.passwordHash) : false;
  await recordLoginAttempt(username, ip, passwordOk);

  // Same generic error for "no such user" and "wrong password" — avoids
  // confirming which usernames exist.
  if (!admin || !passwordOk) {
    return { error: "Invalid username or password" };
  }

  const stage = admin.totpEnabled ? "verify" : "enroll";
  const pending = await getPendingSession();
  pending.adminId = admin.id;
  pending.stage = stage;
  if (stage === "enroll") {
    pending.totpSecret = generateTotpSecret();
  }
  await pending.save();

  return { next: stage };
}

/**
 * Confirms the first TOTP code against the not-yet-persisted secret
 * generated for this pending login, then permanently enables MFA for the
 * admin and establishes a full session.
 */
export async function enrollTotp(values: unknown): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter the 6-digit code" };
  }

  const pending = await getPendingSession();
  if (!pending.adminId || pending.stage !== "enroll" || !pending.totpSecret) {
    return { error: "Your session expired — log in again." };
  }

  if (!verifyTotpToken(pending.totpSecret, parsed.data.code)) {
    return { error: "Incorrect code. Check your authenticator app and try again." };
  }

  const admin = await adminPrisma.adminUser.update({
    where: { id: pending.adminId },
    data: {
      totpSecret: encryptSecret(pending.totpSecret),
      totpEnabled: true,
      lastLoginAt: new Date(),
    },
  });

  await establishSession(admin.id, admin.username);
  await writeAuditLog({ adminId: admin.id, username: admin.username, action: "ENROLL_MFA" });
  redirect("/dashboard");
}

/** Confirms a TOTP code for an admin who already completed enrollment on a prior login. */
export async function verifyTotp(values: unknown): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter the 6-digit code" };
  }

  const pending = await getPendingSession();
  if (!pending.adminId || pending.stage !== "verify") {
    return { error: "Your session expired — log in again." };
  }

  const admin = await adminPrisma.adminUser.findUnique({ where: { id: pending.adminId } });
  if (!admin || !admin.totpEnabled || !admin.totpSecret) {
    return { error: "Your session expired — log in again." };
  }

  const ip = getClientIp();
  if (await isRateLimited(admin.username, ip)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const codeOk = verifyTotpToken(decryptSecret(admin.totpSecret), parsed.data.code);
  await recordLoginAttempt(admin.username, ip, codeOk);
  if (!codeOk) {
    return { error: "Incorrect code" };
  }

  await adminPrisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await establishSession(admin.id, admin.username);
  await writeAuditLog({ adminId: admin.id, username: admin.username, action: "LOGIN" });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session.adminId) {
    await writeAuditLog({ adminId: session.adminId, username: session.username, action: "LOGOUT" });
  }
  await destroySession();
  redirect("/login");
}
