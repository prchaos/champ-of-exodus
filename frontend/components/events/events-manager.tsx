"use client";

import { Button } from "@/components/ui/button";
import type { EventRecord } from "@/lib/actions/events";
import { EVENT_TYPE_LABELS } from "@/lib/validations/event";

// TODO: wire up once the Discord webhook integration is defined — this
// should not fire automatically, only when explicitly clicked.
function handleDiscordPost(_event: EventRecord) {}

export function EventsManager({ events }: { events: EventRecord[] }) {
  if (events.length === 0) {
    return <p>No events yet.</p>;
  }

  return (
    <div className="grid">
      {events.map((event) => (
        <article key={event.id} className="card">
          <h2>{event.name}</h2>
          {event.image && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied source (data URL or external URL)
            <img src={event.image} alt="" className="image-preview" />
          )}
          <p>{event.description}</p>
          <p>
            <strong>Type:</strong> {EVENT_TYPE_LABELS[event.type]}
          </p>
          <p>
            <strong>Date:</strong> {new Date(event.date).toLocaleDateString()} at {event.time}
          </p>
          <p>
            <strong>Reward:</strong> {event.reward}
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => handleDiscordPost(event)}>
              Discord
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
