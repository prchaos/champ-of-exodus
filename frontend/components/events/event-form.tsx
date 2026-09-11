"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/events/image-field";
import { getCurrentTimeString, getTodayDateString } from "@/lib/datetime";
import { EVENT_TYPES, EVENT_TYPE_LABELS, eventFormSchema, type EventFormValues } from "@/lib/validations/event";

const EMPTY_VALUES: EventFormValues = {
  name: "",
  eventType: "SKILL",
  description: "",
  date: "",
  time: "",
  reward: "",
  image: undefined,
};

export function EventForm({
  defaultValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaultValues?: Partial<EventFormValues>;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => void | Promise<void>;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const todayStr = getTodayDateString();
  const selectedDate = useWatch({ control, name: "date" });
  const minTime = selectedDate === todayStr ? getCurrentTimeString() : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="event-name">Event name</label>
      <input id="event-name" {...register("name")} />
      {errors.name && <p className="field-error">{errors.name.message}</p>}

      <label htmlFor="event-type">Event type</label>
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

      <label>Image</label>
      <Controller
        control={control}
        name="image"
        render={({ field }) => <ImageField value={field.value} onChange={field.onChange} />}
      />
      {errors.image && <p className="field-error">{errors.image.message}</p>}

      <div className="modal-actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
