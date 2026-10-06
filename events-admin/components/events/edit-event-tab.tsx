"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EditEventModal } from "@/components/events/edit-event-modal";
import { listRecentEvents, type RecentEvent } from "@/lib/actions/events";
import { EVENT_TYPE_LABELS } from "@/lib/validations/event";

export function EditEventTab() {
  const [expanded, setExpanded] = useState(false);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RecentEvent | null>(null);

  async function loadEvents() {
    setLoading(true);
    try {
      setEvents(await listRecentEvents());
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) await loadEvents();
  }

  return (
    <div className="card">
      <div className="tab-header">
        <h2>Edit event</h2>
        <Button type="button" onClick={toggle}>
          {expanded ? "Close" : "Edit event"}
        </Button>
      </div>

      {expanded && (
        <>
          {loading && <p>Loading recent events...</p>}
          {!loading && events.length === 0 && <p>No events yet.</p>}
          {!loading && events.length > 0 && (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.name}</td>
                      <td>{EVENT_TYPE_LABELS[event.type]}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.time}</td>
                      <td>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingEvent(event)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => {
            setEditingEvent(null);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}
