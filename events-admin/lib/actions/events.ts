"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { eventsPrisma } from "@/lib/prisma/events-client";
import { getValidSession } from "@/lib/session";
import { createEventSchema, updateEventSchema } from "@/lib/validations/event";

async function requireSession() {
  const session = await getValidSession();
  if (!session) redirect("/login");
  return session;
}

export async function createEvent(values: unknown) {
  const session = await requireSession();
  const parsed = createEventSchema.parse(values);

  const event = await eventsPrisma.event.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      date: new Date(parsed.date),
      time: parsed.time,
      reward: parsed.reward,
      type: parsed.eventType,
      createdBy: session.username,
    },
  });

  await writeAuditLog({
    adminId: session.adminId,
    username: session.username,
    action: "CREATE_EVENT",
    eventId: event.id,
  });

  revalidatePath("/dashboard");
  return event;
}

/** The 5 most recently created events, for the Edit Event tab's default list. */
export async function listRecentEvents() {
  await requireSession();
  return eventsPrisma.event.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
}

export type RecentEvent = Awaited<ReturnType<typeof listRecentEvents>>[number];

/** Updates name/date/time/description/reward — never touches createdBy, so the original author is preserved. */
export async function updateEvent(id: string, values: unknown) {
  const session = await requireSession();
  const parsed = updateEventSchema.parse(values);

  const event = await eventsPrisma.event.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description,
      date: new Date(parsed.date),
      time: parsed.time,
      reward: parsed.reward,
    },
  });

  await writeAuditLog({
    adminId: session.adminId,
    username: session.username,
    action: "UPDATE_EVENT",
    eventId: event.id,
  });

  revalidatePath("/dashboard");
  return event;
}
