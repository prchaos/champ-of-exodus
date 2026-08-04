"""FastAPI entrypoint for champ-of-exodus backend."""

from __future__ import annotations

import logging

from fastapi import Depends, FastAPI, HTTPException, status

from .config import Settings, load_settings
from .discord_client import DiscordWebhookClient
from .models import Event, EventCreate, EventUpdate
from .repository import EventRepository
from .service import EventService


logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Champ of Exodus API", version="0.1.0")


def get_event_service() -> EventService:
    """Build service dependencies per request.

    Args:
        None.

    Returns:
        Configured EventService instance.

    Raises:
        ValueError: If required configuration is missing.
    """

    settings: Settings = load_settings()
    repository = EventRepository(
        project_id=settings.project_id,
        collection_name=settings.events_collection,
    )
    discord_client = DiscordWebhookClient(settings.discord_webhook_url)
    return EventService(repository=repository, discord_client=discord_client)


@app.get("/")
def root() -> dict[str, object]:
    """API index endpoint.

    Args:
        None.

    Returns:
        Basic API metadata and route hints.
    """

    return {
        "service": "Champ of Exodus API",
        "status": "ok",
        "endpoints": {
            "health": "/health",
            "events": "/events",
            "docs": "/docs",
        },
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness endpoint.

    Args:
        None.

    Returns:
        Basic status payload.
    """

    return {"status": "ok"}


@app.get("/events", response_model=list[Event])
def list_events(service: EventService = Depends(get_event_service)) -> list[Event]:
    """List all events.

    Args:
        service: Event service dependency.

    Returns:
        List of events.
    """

    return service.list_events()


@app.post("/events", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, service: EventService = Depends(get_event_service)) -> Event:
    """Create an event.

    Args:
        payload: Event payload.
        service: Event service dependency.

    Returns:
        Created event.
    """

    return service.create_event(payload)


@app.patch("/events/{event_id}", response_model=Event)
def update_event(
    event_id: str,
    payload: EventUpdate,
    service: EventService = Depends(get_event_service),
) -> Event:
    """Update an event.

    Args:
        event_id: Event id.
        payload: Partial update payload.
        service: Event service dependency.

    Returns:
        Updated event.

    Raises:
        HTTPException: If event is not found.
    """

    event = service.update_event(event_id, payload)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@app.delete("/events/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(event_id: str, service: EventService = Depends(get_event_service)) -> dict[str, bool]:
    """Delete an event.

    Args:
        event_id: Event id.
        service: Event service dependency.

    Returns:
        Deletion status payload.

    Raises:
        HTTPException: If event is not found.
    """

    deleted = service.delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return {"deleted": True}
