"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreateEventForm } from "@/components/events/create-event-form";

export function CreateEventTab() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <div className="tab-header">
        <h2>Create event</h2>
        <Button type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Close" : "Create event"}
        </Button>
      </div>
      {expanded && <CreateEventForm onCreated={() => setExpanded(false)} />}
    </div>
  );
}
