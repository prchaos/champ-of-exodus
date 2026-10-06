import { headers } from "next/headers";

import { adminPrisma } from "@/lib/prisma/admin-client";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** Best-effort client IP from the Cloud Run load balancer's forwarded-for header. */
export function getClientIp(): string {
  const forwardedFor = headers().get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

/**
 * Locks out further attempts once either the username or the IP has hit
 * MAX_FAILED_ATTEMPTS failures within WINDOW_MS — blunts both
 * credential-stuffing (many usernames, one IP) and targeted brute-forcing
 * (one username, rotating IPs).
 */
export async function isRateLimited(username: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byUsername, byIp] = await Promise.all([
    adminPrisma.adminLoginAttempt.count({
      where: { username, succeeded: false, createdAt: { gte: since } },
    }),
    adminPrisma.adminLoginAttempt.count({
      where: { ip, succeeded: false, createdAt: { gte: since } },
    }),
  ]);
  return byUsername >= MAX_FAILED_ATTEMPTS || byIp >= MAX_FAILED_ATTEMPTS;
}

export async function recordLoginAttempt(username: string, ip: string, succeeded: boolean): Promise<void> {
  await adminPrisma.adminLoginAttempt.create({ data: { username, ip, succeeded } });
}
