import { prisma } from "@/lib/prisma";

/**
 * Fetches every clan event, soonest first, for display on the events page.
 * @returns All events currently stored in the database.
 */
export async function getEvents() {
  return prisma.event.findMany({ orderBy: { date: "asc" } });
}

export type EventRecord = Awaited<ReturnType<typeof getEvents>>[number];
