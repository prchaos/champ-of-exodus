const BOARDS = [
  {
    name: "Clan Announcements",
    description: "Leadership announcements, policy updates, and patch notes.",
  },
  {
    name: "PvM Strategy",
    description: "Boss loadouts, rotations, and role assignments.",
  },
  {
    name: "Skilling Hub",
    description: "Training routes, efficiency tips, and gathering goals.",
  },
  {
    name: "Loot & Milestones",
    description: "Rare drops, progression screenshots, and records.",
  },
];

export default function ForumPage() {
  return (
    <main className="card">
      <h1>Forum Boards</h1>
      <div className="grid">
        {BOARDS.map((board) => (
          <article key={board.name} className="card">
            <h2>{board.name}</h2>
            <p>{board.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
