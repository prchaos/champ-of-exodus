"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { eventFormSchema, type EventFormValues } from "@/lib/validations/event";

/**
 * Fetches every clan event, soonest first, for display on the events page.
 * @returns All events currently stored in the database.
 */
export async function getEvents() {
  return prisma.event.findMany({ orderBy: { date: "asc" } });
}

export type EventRecord = Awaited<ReturnType<typeof getEvents>>[number];

/**
 * Creates a new event and refreshes the events page.
 *
 * The Discord announcement is posted separately via the per-event Discord
 * button, not automatically on create.
 * @param values - The event fields collected from the create form.
 * @returns The newly created event.
 * @throws {import("zod").ZodError} If `values` fails schema validation.
 */
export async function createEvent(values: EventFormValues) {
  const parsed = eventFormSchema.parse(values);
  const event = await prisma.event.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      date: new Date(parsed.date),
      time: parsed.time,
      reward: parsed.reward,
      type: parsed.eventType,
      image: parsed.image ?? null,
    },
  });
  revalidatePath("/events");
  return event;
}

/**
 * Updates an existing event from the edit form's Done button and refreshes
 * the events page.
 * @param id - id of the event being edited.
 * @param values - The updated event fields collected from the edit form.
 * @returns The updated event.
 * @throws {import("zod").ZodError} If `values` fails schema validation.
 * @throws {import("@prisma/client").Prisma.PrismaClientKnownRequestError} If no event with that id exists.
 */
export async function updateEvent(id: string, values: EventFormValues) {
  const parsed = eventFormSchema.parse(values);
  const event = await prisma.event.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description,
      date: new Date(parsed.date),
      time: parsed.time,
      reward: parsed.reward,
      type: parsed.eventType,
      image: parsed.image ?? null,
    },
  });
  revalidatePath("/events");
  return event;
}

/**
 * Permanently deletes an event and refreshes the events page.
 * @param id - id of the event to delete.
 * @throws {import("@prisma/client").Prisma.PrismaClientKnownRequestError} If no event with that id exists.
 */
export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath("/events");
}
