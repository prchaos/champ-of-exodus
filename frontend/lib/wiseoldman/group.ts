import { z } from "zod";

const WOM_API_BASE = "https://api.wiseoldman.net/v2";
const FETCH_TIMEOUT_MS = 10_000;

const roleOrderSchema = z.object({
  role: z.string(),
  index: z.number(),
});

const womPlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string(),
  type: z.string(),
  exp: z.number(),
  ehp: z.number(),
  ehb: z.number(),
  updatedAt: z.string(),
  lastChangedAt: z.string().nullable(),
});

const womMembershipSchema = z.object({
  role: z.string().nullable(),
  clientSyncJoinedAt: z.string().nullable(),
  createdAt: z.string(),
  player: womPlayerSchema,
});

const womGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  memberCount: z.number(),
  roleOrders: z.array(roleOrderSchema),
  memberships: z.array(womMembershipSchema),
});

export type WomGroup = z.infer<typeof womGroupSchema>;

export type WomGroupFetchResult =
  | { status: "ok"; data: WomGroup }
  | { status: "not_found" }
  | { status: "error"; message: string };

/** Builds the Wise Old Man v2 group endpoint URL for a given group id. */
export function buildWomGroupUrl(groupId: string): string {
  return `${WOM_API_BASE}/groups/${encodeURIComponent(groupId)}`;
}

/**
 * Retries `fn` with exponential backoff plus jitter.
 * @param fn - The operation to attempt.
 * @param opts - `retries` is the number of retries after the first attempt (default 2, so 3 attempts total); `baseDelayMs` seeds the backoff (default 500).
 * @throws Whatever `fn`'s last attempt threw, once retries are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 500;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Fetches and validates a Wise Old Man group's roster.
 *
 * A 404 (group not found — likely a misconfigured group id) is treated as an
 * expected, non-transient outcome and returned immediately without
 * retrying. Network failures, non-2xx responses other than 404, and
 * malformed/unexpected response shapes are retried via {@link withRetry}
 * before falling back to an `"error"` result.
 * @param groupId - The Wise Old Man group id to look up.
 * @returns A discriminated result: `"ok"` with the parsed group, `"not_found"`, or `"error"` with a message.
 */
export async function fetchWomGroup(groupId: string): Promise<WomGroupFetchResult> {
  const url = buildWomGroupUrl(groupId);

  try {
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.status === 404) {
          return res;
        }
        if (!res.ok) {
          throw new Error(`Wise Old Man group request failed with status ${res.status}`);
        }
        return res;
      } finally {
        clearTimeout(timeout);
      }
    });

    if (response.status === 404) {
      return { status: "not_found" };
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      return { status: "error", message: "Wise Old Man response was not valid JSON" };
    }

    const parsed = womGroupSchema.safeParse(json);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.message };
    }

    return { status: "ok", data: parsed.data };
  } catch (error) {
    console.error("Wise Old Man group fetch failed", { groupId, error });
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export type WomMemberRow = {
  playerId: number;
  username: string;
  displayName: string;
  profileUrl: string;
  accountType: string;
  roleLabel: string;
  roleIndex: number;
  exp: number;
  ehp: number;
  ehb: number;
  joinedAt: Date | null;
  lastProgressedAt: Date | null;
};

function titleCase(value: string): string {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Shapes a validated Wise Old Man group into display-ready member rows,
 * sorted by the group's own role order (unranked/unknown roles last, then
 * alphabetically by display name).
 * @param group - A group already fetched and validated via {@link fetchWomGroup}.
 * @returns One row per membership, ready for the roster table.
 */
export function buildMemberRows(group: WomGroup): WomMemberRow[] {
  const roleIndexByRole = new Map(group.roleOrders.map((entry) => [entry.role, entry.index]));

  const rows: WomMemberRow[] = group.memberships.map((membership) => {
    const roleIndex = membership.role !== null ? roleIndexByRole.get(membership.role) : undefined;
    return {
      playerId: membership.player.id,
      username: membership.player.username,
      displayName: membership.player.displayName,
      profileUrl: `https://wiseoldman.net/players/${encodeURIComponent(membership.player.username)}`,
      accountType: titleCase(membership.player.type),
      roleLabel: membership.role ? titleCase(membership.role) : "Unranked",
      roleIndex: roleIndex ?? Number.POSITIVE_INFINITY,
      exp: membership.player.exp,
      ehp: membership.player.ehp,
      ehb: membership.player.ehb,
      joinedAt: membership.clientSyncJoinedAt
        ? new Date(membership.clientSyncJoinedAt)
        : membership.createdAt
          ? new Date(membership.createdAt)
          : null,
      lastProgressedAt: membership.player.lastChangedAt ? new Date(membership.player.lastChangedAt) : null,
    };
  });

  return rows.sort((a, b) => {
    if (a.roleIndex !== b.roleIndex) return a.roleIndex - b.roleIndex;
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
  });
}
