"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { updateEvent, type RecentEvent } from "@/lib/actions/events";
import { getTodayDateString } from "@/lib/datetime";
import { updateEventSchema, type UpdateEventValues } from "@/lib/validations/event";

function toFormValues(event: RecentEvent): UpdateEventValues {
  return {
    name: event.name,
    description: event.description,
    date: new Date(event.date).toISOString().slice(0, 10),
    time: event.time,
    reward: event.reward,
  };
}

export function EditEventModal({
  event,
  onClose,
  onSaved,
}: {
  event: RecentEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEventValues>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: toFormValues(event),
  });

  async function onSubmit(values: UpdateEventValues) {
    setFormError(null);
    try {
      await updateEvent(event.id, values);
      onSaved();
    } catch {
      setFormError("Couldn't save the event. Try again.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-panel" onClick={(event) => event.stopPropagation()}>
        <h2>Edit event</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="edit-name">Event name</label>
          <input id="edit-name" {...register("name")} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}

          <label htmlFor="edit-date">Date</label>
          <input id="edit-date" type="date" min={getTodayDateString()} {...register("date")} />
          {errors.date && <p className="field-error">{errors.date.message}</p>}

          <label htmlFor="edit-time">Time</label>
          <input id="edit-time" type="time" {...register("time")} />
          {errors.time && <p className="field-error">{errors.time.message}</p>}

          <label htmlFor="edit-description">Description</label>
          <textarea id="edit-description" rows={4} {...register("description")} />
          {errors.description && <p className="field-error">{errors.description.message}</p>}

          <label htmlFor="edit-reward">Reward</label>
          <input id="edit-reward" {...register("reward")} />
          {errors.reward && <p className="field-error">{errors.reward.message}</p>}

          {formError && <p className="form-error">{formError}</p>}

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
