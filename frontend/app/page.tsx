import { getUpcomingEvents } from "@/lib/actions/events";

// Reads live event data — prerendering this would require a reachable
// DATABASE_URL at Docker build time, same reasoning as /events.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const upcomingEvents = await getUpcomingEvents();

  return (
    <main className="card">
      <h1>Welcome to Champ of Exodus</h1>
      <p>Old School Runescape clan HQ for events synced to Discord.</p>
      <section>
        <h2>Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p>No upcoming events yet — check back soon.</p>
        ) : (
          <div className="grid">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="card">
                <h3>{event.name}</h3>
                <p>
                  <strong>When:</strong> {new Date(event.date).toLocaleDateString()} at{" "}
                  {event.time}
                </p>
                <p>
                  <strong>Posted by:</strong> {event.createdBy ?? "Unknown"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
