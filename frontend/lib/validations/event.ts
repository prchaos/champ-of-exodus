import { z } from "zod";

/** The four event categories selectable in the create/edit event forms. */
export const EVENT_TYPES = ["SKILL", "BOSS", "MINIGAME", "CUSTOM"] as const;

/** Human-readable labels for each {@link EVENT_TYPES} value. */
export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  SKILL: "Skill",
  BOSS: "Boss",
  MINIGAME: "Minigame",
  CUSTOM: "Custom",
};

/**
 * Validates the fields collected by the create/edit event form.
 *
 * Beyond per-field checks, the combined date and time must not be in the
 * past — enforced here so it also catches submissions that bypass the
 * form's `min` attributes (e.g. a stale form left open past midnight).
 */
export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required").max(120, "Keep the name under 120 characters"),
    eventType: z.enum(EVENT_TYPES),
    description: z.string().trim().min(1, "Description is required"),
    date: z.string().trim().min(1, "Date is required"),
    time: z.string().trim().min(1, "Time is required"),
    reward: z.string().trim().min(1, "Reward is required"),
    image: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
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
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
