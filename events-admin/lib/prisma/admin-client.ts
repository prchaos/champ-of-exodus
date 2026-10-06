import { PrismaClient } from "@/lib/generated/admin-client";

// Points at the events_admin database — login credentials, MFA, audit log.
// Dev-hot-reload-safe singleton, same pattern as frontend/lib/prisma.ts.
const globalForPrisma = globalThis as unknown as { adminPrisma?: PrismaClient };

export const adminPrisma = globalForPrisma.adminPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.adminPrisma = adminPrisma;
