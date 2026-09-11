import { EventsManager } from "@/components/events/events-manager";
import { getEvents } from "@/lib/actions/events";

// Events are created/edited/deleted live, and prerendering this page would
// require a DATABASE_URL (and a reachable Postgres) at Docker build time.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="card">
      <h1>Events</h1>
      <p>Create, edit, and remove clan events. Discord announcements are coming soon.</p>
      <EventsManager events={events} />
    </main>
  );
}
