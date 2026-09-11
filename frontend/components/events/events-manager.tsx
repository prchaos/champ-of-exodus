"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/events/event-form";
import { EventModal } from "@/components/events/event-modal";
import { createEvent, deleteEvent, updateEvent, type EventRecord } from "@/lib/actions/events";
import { EVENT_TYPE_LABELS, type EventFormValues } from "@/lib/validations/event";

type ActiveModal = { mode: "create" } | { mode: "edit"; event: EventRecord } | null;

function toDateInputValue(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return parsed.toISOString().slice(0, 10);
}

export function EventsManager({ events }: { events: EventRecord[] }) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function closeModal() {
    setActiveModal(null);
  }

  async function handleCreate(values: EventFormValues) {
    await createEvent(values);
    closeModal();
    router.refresh();
  }

  async function handleEditDone(id: string, values: EventFormValues) {
    await updateEvent(id, values);
    closeModal();
    router.refresh();
  }

  function handleDelete(event: EventRecord) {
    if (!window.confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    startDeleteTransition(async () => {
      await deleteEvent(event.id);
      router.refresh();
    });
  }

  // TODO: wire up once the Discord webhook integration is defined — this
  // should not fire automatically on create, only when explicitly clicked.
  function handleDiscordPost(_event: EventRecord) {}

  return (
    <>
      <div className="modal-actions">
        <Button onClick={() => setActiveModal({ mode: "create" })}>Create Event</Button>
      </div>

      {events.length === 0 ? (
        <p>No events yet. Create the first one above.</p>
      ) : (
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
                <Button variant="outline" onClick={() => setActiveModal({ mode: "edit", event })}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(event)} disabled={isDeleting}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeModal?.mode === "create" && (
        <EventModal title="Create Event" onClose={closeModal}>
          <EventForm submitLabel="Create" onCancel={closeModal} onSubmit={handleCreate} />
        </EventModal>
      )}

      {activeModal?.mode === "edit" && (
        <EventModal title={`Edit ${activeModal.event.name}`} onClose={closeModal}>
          <EventForm
            defaultValues={{
              name: activeModal.event.name,
              eventType: activeModal.event.type,
              description: activeModal.event.description,
              date: toDateInputValue(activeModal.event.date),
              time: activeModal.event.time,
              reward: activeModal.event.reward,
              image: activeModal.event.image ?? undefined,
            }}
            submitLabel="Done"
            onCancel={closeModal}
            onSubmit={(values) => handleEditDone(activeModal.event.id, values)}
          />
        </EventModal>
      )}
    </>
  );
}
