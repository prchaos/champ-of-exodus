import type { WomMemberRow } from "@/lib/wiseoldman/group";

export function MembersRoster({
  members,
  groupId,
  groupName,
  memberCount,
}: {
  members: WomMemberRow[];
  groupId: number;
  groupName: string;
  memberCount: number;
}) {
  return (
    <>
      <p>
        {groupName} — {memberCount} members. Managed on{" "}
        <a href={`https://wiseoldman.net/groups/${groupId}`} target="_blank" rel="noreferrer">
          Wise Old Man
        </a>
        .
      </p>

      <div className="table-wrap">
        <table className="members-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Rank</th>
              <th>Account type</th>
              <th>Joined</th>
              <th>EHP</th>
              <th>EHB</th>
              <th>Overall XP</th>
              <th>Last progressed</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.playerId}>
                <td>
                  <a href={member.profileUrl} target="_blank" rel="noreferrer">
                    {member.displayName}
                  </a>
                </td>
                <td>{member.roleLabel}</td>
                <td>{member.accountType}</td>
                <td>{member.joinedAt ? member.joinedAt.toLocaleDateString() : "—"}</td>
                <td>{member.ehp.toFixed(1)}</td>
                <td>{member.ehb.toFixed(1)}</td>
                <td>{member.exp.toLocaleString()}</td>
                <td>{member.lastProgressedAt ? member.lastProgressedAt.toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
