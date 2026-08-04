"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EventCategory = "skill" | "boss" | "minigame";

type ClanEvent = {
  id: string;
  name: string;
  description: string;
  event_datetime: string;
  reward: string;
  category: EventCategory;
  created_at: string;
  updated_at: string;
};

type EventFormState = {
  name: string;
  description: string;
  event_datetime: string;
  reward: string;
  category: EventCategory;
};

const EMPTY_FORM: EventFormState = {
  name: "",
  description: "",
  event_datetime: "",
  reward: "",
  category: "boss",
};

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EventsPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  const [events, setEvents] = useState<ClanEvent[]>([]);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  async function loadEvents(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/events`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load events");
      }
      const payload = (await response.json()) as ClanEvent[];
      setEvents(payload);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  function handleStartEdit(event: ClanEvent): void {
    setEditingId(event.id);
    setForm({
      name: event.name,
      description: event.description,
      event_datetime: toLocalInputValue(event.event_datetime),
      reward: event.reward,
      category: event.category,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      description: form.description,
      event_datetime: new Date(form.event_datetime).toISOString(),
      reward: form.reward,
      category: form.category,
    };

    try {
      const target = isEditing
        ? `${apiBaseUrl}/events/${editingId}`
        : `${apiBaseUrl}/events`;
      const method = isEditing ? "PATCH" : "POST";
      const response = await fetch(target, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(
          `Unable to ${isEditing ? "update" : "create"} event at this time`,
        );
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadEvents();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unexpected error";
      setError(message);
    }
  }

  async function handleDelete(eventId: string): Promise<void> {
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      await loadEvents();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Unexpected error";
      setError(message);
    }
  }

  return (
    <main className="card">
      <h1>Events</h1>
      <p>Create events and sync announcements to your Discord channel.</p>
      {error ? <p>{error}</p> : null}

      <form className="card" onSubmit={(evt) => void handleSubmit(evt)}>
        <h2>{isEditing ? "Edit Event" : "Create Event"}</h2>
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            required
          />
        </label>

        <label>
          Date & Time
          <input
            type="datetime-local"
            value={form.event_datetime}
            onChange={(e) => setForm({ ...form, event_datetime: e.target.value })}
            required
          />
        </label>

        <label>
          Reward
          <input
            value={form.reward}
            onChange={(e) => setForm({ ...form, reward: e.target.value })}
            required
          />
        </label>

        <label>
          Category
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as EventCategory })
            }
          >
            <option value="skill">Skill</option>
            <option value="boss">Boss</option>
            <option value="minigame">Minigame</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button type="submit">{isEditing ? "Update" : "Create"} Event</button>
          {isEditing ? (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <section className="card">
        <h2>Upcoming Events</h2>
        {loading ? <p>Loading...</p> : null}
        {!loading && events.length === 0 ? <p>No events yet.</p> : null}
        <div className="grid">
          {events.map((event) => (
            <article key={event.id} className="card">
              <h3>{event.name}</h3>
              <p>{event.description}</p>
              <p>
                <strong>When:</strong> {new Date(event.event_datetime).toLocaleString()}
              </p>
              <p>
                <strong>Reward:</strong> {event.reward}
              </p>
              <p>
                <strong>Category:</strong> {event.category}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => handleStartEdit(event)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void handleDelete(event.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
