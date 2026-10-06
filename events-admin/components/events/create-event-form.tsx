"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { createEvent } from "@/lib/actions/events";
import { getCurrentTimeString, getTodayDateString } from "@/lib/datetime";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  createEventSchema,
  type CreateEventValues,
} from "@/lib/validations/event";

const EMPTY_VALUES: CreateEventValues = {
  name: "",
  eventType: "SKILL",
  description: "",
  date: "",
  time: "",
  reward: "",
};

export function CreateEventForm({ onCreated }: { onCreated?: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: EMPTY_VALUES,
  });

  const todayStr = getTodayDateString();
  const selectedDate = useWatch({ control, name: "date" });
  const minTime = selectedDate === todayStr ? getCurrentTimeString() : undefined;

  async function onSubmit(values: CreateEventValues) {
    setFormError(null);
    try {
      await createEvent(values);
      reset(EMPTY_VALUES);
      onCreated?.();
    } catch {
      setFormError("Couldn't create the event. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="event-name">Event name</label>
      <input id="event-name" {...register("name")} />
      {errors.name && <p className="field-error">{errors.name.message}</p>}

      <label htmlFor="event-type">Category</label>
      <select id="event-type" {...register("eventType")}>
        {EVENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {EVENT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      {errors.eventType && <p className="field-error">{errors.eventType.message}</p>}

      <label htmlFor="event-description">Description</label>
      <textarea id="event-description" rows={4} {...register("description")} />
      {errors.description && <p className="field-error">{errors.description.message}</p>}

      <label htmlFor="event-date">Date</label>
      <input id="event-date" type="date" min={todayStr} {...register("date")} />
      {errors.date && <p className="field-error">{errors.date.message}</p>}

      <label htmlFor="event-time">Time</label>
      <input id="event-time" type="time" min={minTime} {...register("time")} />
      {errors.time && <p className="field-error">{errors.time.message}</p>}

      <label htmlFor="event-reward">Reward</label>
      <input id="event-reward" {...register("reward")} />
      {errors.reward && <p className="field-error">{errors.reward.message}</p>}

      {formError && <p className="form-error">{formError}</p>}

      <div className="modal-actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
