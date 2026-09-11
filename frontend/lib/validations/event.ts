/** The four event categories shown on the events page. */
export const EVENT_TYPES = ["SKILL", "BOSS", "MINIGAME", "CUSTOM"] as const;

/** Human-readable labels for each {@link EVENT_TYPES} value. */
export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  SKILL: "Skill",
  BOSS: "Boss",
  MINIGAME: "Minigame",
  CUSTOM: "Custom",
};
