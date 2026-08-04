const RANKS = [
  { name: "Warlord", duty: "Leads strategy and alliance diplomacy." },
  { name: "Centurion", duty: "Runs weekly bossing and raid ops." },
  { name: "Legionnaire", duty: "Mentors recruits and hosts skilling events." },
  { name: "Vanguard", duty: "Core members with event voting rights." },
  { name: "Recruit", duty: "Probation rank for new members." },
];

export default function RanksPage() {
  return (
    <main className="card">
      <h1>Clan Ranks</h1>
      <div className="grid">
        {RANKS.map((rank) => (
          <article key={rank.name} className="card">
            <h2>{rank.name}</h2>
            <p>{rank.duty}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
