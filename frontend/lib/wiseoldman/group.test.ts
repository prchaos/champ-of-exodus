import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMemberRows, fetchWomGroup } from "./group";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const sampleGroupResponse = {
  id: 15387,
  name: "Exodus Rs",
  memberCount: 6,
  roleOrders: [
    { groupId: 15387, role: "owner", index: 0 },
    { groupId: 15387, role: "deputy_owner", index: 1 },
    { groupId: 15387, role: "astral", index: 2 },
  ],
  memberships: [
    {
      playerId: 1,
      role: "owner",
      clientSyncJoinedAt: "2026-01-14T00:00:00.000Z",
      createdAt: "2025-11-22T17:13:25.689Z",
      player: {
        id: 1,
        username: "ginzxarc",
        displayName: "ginzxarc",
        type: "regular",
        exp: 150616333,
        ehp: 291.57596,
        ehb: 17.22688,
        updatedAt: "2026-08-27T15:24:52.957Z",
        lastChangedAt: "2026-08-27T15:24:52.957Z",
      },
    },
    {
      playerId: 2,
      role: "deputy_owner",
      clientSyncJoinedAt: "2026-01-14T00:00:00.000Z",
      createdAt: "2025-11-22T17:56:52.071Z",
      player: {
        id: 2,
        username: "futiee",
        displayName: "Futiee",
        type: "ironman",
        exp: 73431368,
        ehp: 169.48977,
        ehb: 38.04802,
        updatedAt: "2026-08-26T21:48:16.824Z",
        lastChangedAt: "2026-08-26T21:48:16.824Z",
      },
    },
    {
      playerId: 3,
      role: "astral",
      clientSyncJoinedAt: null,
      createdAt: "2026-08-08T00:09:41.599Z",
      player: {
        id: 3,
        username: "hcbuttsniffr",
        displayName: "hcbuttsniffr",
        type: "hardcore",
        exp: 7628967,
        ehp: 78.95658,
        ehb: 0.3,
        updatedAt: "2026-08-27T13:44:02.279Z",
        lastChangedAt: null,
      },
    },
    {
      playerId: 4,
      role: null,
      clientSyncJoinedAt: "2026-01-15T00:00:00.000Z",
      createdAt: "2026-01-15T01:02:31.877Z",
      player: {
        id: 4,
        username: "drowsyuim",
        displayName: "drowsyuim",
        type: "ultimate",
        exp: 25352587,
        ehp: 156.87767,
        ehb: 0,
        updatedAt: "2026-08-26T21:03:59.927Z",
        lastChangedAt: "2026-08-24T11:01:17.789Z",
      },
    },
    {
      playerId: 5,
      role: "legend", // not present in roleOrders — should sort last
      clientSyncJoinedAt: "2026-05-10T00:00:00.000Z",
      createdAt: "2026-05-10T22:17:00.642Z",
      player: {
        id: 5,
        username: "rizmain",
        displayName: "RizMain",
        type: "regular",
        exp: 22343642,
        ehp: 106.18433,
        ehb: 7.31327,
        updatedAt: "2026-08-26T21:03:28.589Z",
        lastChangedAt: "2026-08-26T21:03:28.589Z",
      },
    },
    {
      playerId: 6,
      role: "astral",
      clientSyncJoinedAt: null,
      createdAt: "2026-07-04T21:09:57.256Z",
      player: {
        id: 6,
        username: "aardvark",
        displayName: "Aardvark",
        type: "regular",
        exp: 1347034,
        ehp: 11.34613,
        ehb: 0.016,
        updatedAt: "2026-08-26T21:03:02.859Z",
        lastChangedAt: "2026-07-26T13:06:35.008Z",
      },
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("fetchWomGroup", () => {
  it("returns the parsed group on a happy-path response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, sampleGroupResponse));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWomGroup("15387");

    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.data.memberships).toHaveLength(6);
    expect(result.status === "ok" && result.data.name).toBe("Exodus Rs");
  });

  it("returns not_found on a 404 without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404, {}));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWomGroup("999999999");

    expect(result).toEqual({ status: "not_found" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error result when the response shape is malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { memberships: "not-an-array" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWomGroup("15387");

    expect(result.status).toBe("error");
  });

  it("retries transient failures with backoff before succeeding", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, sampleGroupResponse));
    vi.stubGlobal("fetch", fetchMock);

    const resultPromise = fetchWomGroup("15387");
    await vi.advanceTimersByTimeAsync(5000);
    const result = await resultPromise;

    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("buildMemberRows", () => {
  it("sorts by roleOrders index, puts unknown/missing roles last, then alphabetically", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, sampleGroupResponse));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchWomGroup("15387");
    if (result.status !== "ok") throw new Error("expected ok result");

    const rows = buildMemberRows(result.data);

    expect(rows.map((row) => row.username)).toEqual([
      "ginzxarc", // owner (0)
      "futiee", // deputy_owner (1)
      "aardvark", // astral (2), alphabetically before hcbuttsniffr
      "hcbuttsniffr", // astral (2)
      "drowsyuim", // role: null -> Infinity, before "legend" (unknown role) alphabetically... see below
      "rizmain", // role: "legend" not in roleOrders -> Infinity
    ]);
  });

  it("derives a title-cased role label from the snake_case role slug", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, sampleGroupResponse));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchWomGroup("15387");
    if (result.status !== "ok") throw new Error("expected ok result");

    const rows = buildMemberRows(result.data);
    const futiee = rows.find((row) => row.username === "futiee");
    const drowsyuim = rows.find((row) => row.username === "drowsyuim");

    expect(futiee?.roleLabel).toBe("Deputy Owner");
    expect(drowsyuim?.roleLabel).toBe("Unranked");
  });

  it("falls back to membership.createdAt when clientSyncJoinedAt is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, sampleGroupResponse));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchWomGroup("15387");
    if (result.status !== "ok") throw new Error("expected ok result");

    const rows = buildMemberRows(result.data);
    const hcbuttsniffr = rows.find((row) => row.username === "hcbuttsniffr");

    expect(hcbuttsniffr?.joinedAt?.toISOString()).toBe("2026-08-08T00:09:41.599Z");
  });
});
