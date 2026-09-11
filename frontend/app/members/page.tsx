import { MembersRoster } from "@/components/members/members-roster";
import { buildMemberRows, fetchWomGroup } from "@/lib/wiseoldman/group";

// docker-compose's `environment:` block (WOM_GROUP_ID included) is only
// injected at container *runtime*, never during `docker build` — so ISR's
// build-time prerender would bake in "WOM_GROUP_ID is not configured"
// permanently. Same class of issue as /events and DATABASE_URL; this page
// needs force-dynamic so the fetch happens per-request, once the running
// container actually has the env var.
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const groupId = process.env.WOM_GROUP_ID;
  if (!groupId) {
    return (
      <main className="card">
        <h1>Clan Members</h1>
        <p className="field-error">WOM_GROUP_ID is not configured.</p>
      </main>
    );
  }

  const result = await fetchWomGroup(groupId);

  if (result.status === "not_found") {
    return (
      <main className="card">
        <h1>Clan Members</h1>
        <p className="field-error">
          The configured Wise Old Man group (id {groupId}) was not found. Check WOM_GROUP_ID.
        </p>
      </main>
    );
  }

  if (result.status === "error") {
    return (
      <main className="card">
        <h1>Clan Members</h1>
        <p className="field-error">Couldn&apos;t load the roster from Wise Old Man right now. Please try again shortly.</p>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Clan Members</h1>
      <MembersRoster
        members={buildMemberRows(result.data)}
        groupId={result.data.id}
        groupName={result.data.name}
        memberCount={result.data.memberCount}
      />
    </main>
  );
}
