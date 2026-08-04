export default function HomePage() {
  return (
    <main className="card">
      <h1>Welcome to Champ of Exodus</h1>
      <p>
        Old School Runescape clan HQ for ranks, forums, and events synced to Discord.
      </p>
      <div className="grid">
        <section className="card">
          <h2>Ranks</h2>
          <p>See command structure and responsibilities by rank.</p>
        </section>
        <section className="card">
          <h2>Forum Boards</h2>
          <p>Share guides, drops, achievements, and strategy threads.</p>
        </section>
        <section className="card">
          <h2>Events Calendar</h2>
          <p>Create or manage clan events with category and rewards.</p>
        </section>
      </div>
    </main>
  );
}
