import { PrismaClient } from "@/lib/generated/events-client";

// Points at the champ_of_exodus database's Event table via a narrow,
// table-scoped credential (events_admin_events_writer) — see
// infra/terraform/cloudsql.tf. This service owns Event's schema/migrations
// going forward; frontend/ keeps a read-only type mirror.
const globalForPrisma = globalThis as unknown as { eventsPrisma?: PrismaClient };

export const eventsPrisma = globalForPrisma.eventsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.eventsPrisma = eventsPrisma;
