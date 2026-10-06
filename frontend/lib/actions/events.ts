import { prisma } from "@/lib/prisma";

/**
 * Fetches every clan event, soonest first, for display on the events page.
 * @returns All events currently stored in the database.
 */
export async function getEvents() {
  return prisma.event.findMany({ orderBy: { date: "asc" } });
}

export type EventRecord = Awaited<ReturnType<typeof getEvents>>[number];

/**
 * Fetches the soonest upcoming events for the homepage teaser. Events are
 * created/edited exclusively by the events-admin service; this only reads.
 * @param limit - Maximum number of events to return.
 * @returns Up to `limit` events with a date today or later, soonest first.
 */
export async function getUpcomingEvents(limit = 5) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return prisma.event.findMany({
    where: { date: { gte: startOfToday } },
    orderBy: { date: "asc" },
    take: limit,
  });
}
