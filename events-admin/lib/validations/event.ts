import { z } from "zod";

/** The four event categories selectable when creating an event. */
export const EVENT_TYPES = ["SKILL", "BOSS", "MINIGAME", "CUSTOM"] as const;

/** Human-readable labels for each {@link EVENT_TYPES} value. */
export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  SKILL: "Skill",
  BOSS: "Boss",
  MINIGAME: "Minigame",
  CUSTOM: "Custom",
};

/**
 * Blocks a combined date+time that's already in the past — shared by both
 * the create and edit schemas so it also catches submissions that bypass
 * the form's `min` attributes (e.g. a stale tab left open past midnight).
 */
function rejectPastDateTime(values: { date: string; time: string }, ctx: z.RefinementCtx) {
  if (!values.date || !values.time) return;
  const selected = new Date(`${values.date}T${values.time}`);
  if (Number.isNaN(selected.getTime())) return;
  if (selected.getTime() < Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Event date and time cannot be in the past",
      path: ["time"],
    });
  }
}

const nameField = z
  .string()
  .trim()
  .min(1, "Event name is required")
  .max(120, "Keep the name under 120 characters");
const descriptionField = z.string().trim().min(1, "Description is required");
const dateField = z.string().trim().min(1, "Date is required");
const timeField = z.string().trim().min(1, "Time is required");
const rewardField = z.string().trim().min(1, "Reward is required");

/** Create Event tab: name, description, date, time, reward, and category. */
export const createEventSchema = z
  .object({
    name: nameField,
    eventType: z.enum(EVENT_TYPES),
    description: descriptionField,
    date: dateField,
    time: timeField,
    reward: rewardField,
  })
  .superRefine(rejectPastDateTime);
export type CreateEventValues = z.infer<typeof createEventSchema>;

/** Edit Event dialog: name, date, time, description, reward — no category, per spec. */
export const updateEventSchema = z
  .object({
    name: nameField,
    description: descriptionField,
    date: dateField,
    time: timeField,
    reward: rewardField,
  })
  .superRefine(rejectPastDateTime);
export type UpdateEventValues = z.infer<typeof updateEventSchema>;
