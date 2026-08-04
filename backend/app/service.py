"""Business logic layer for clan events."""

from __future__ import annotations

import logging

from .discord_client import DiscordWebhookClient
from .models import Event, EventCreate, EventUpdate
from .repository import EventRepository


LOGGER = logging.getLogger(__name__)


class EventService:
    """Coordinates event persistence and external notifications."""

    def __init__(self, repository: EventRepository, discord_client: DiscordWebhookClient) -> None:
        """Initialize service dependencies.

        Args:
            repository: Event data repository.
            discord_client: Discord webhook integration client.

        Returns:
            None.
        """

        self.repository = repository
        self.discord_client = discord_client

    def create_event(self, payload: EventCreate) -> Event:
        """Create an event and announce it to Discord.

        Args:
            payload: Event creation payload.

        Returns:
            Newly created event.

        Raises:
            Exception: Propagates repository or Discord client errors.
        """

        event = self.repository.create_event(payload)
        self.discord_client.post_event(event)
        LOGGER.info("Event created and Discord notification attempted")
        return event

    def list_events(self) -> list[Event]:
        """Fetch all events.

        Args:
            None.

        Returns:
            Ordered event list.
        """

        return self.repository.list_events()

    def update_event(self, event_id: str, payload: EventUpdate) -> Event | None:
        """Update an event by ID.

        Args:
            event_id: Event ID.
            payload: Partial updates.

        Returns:
            Updated event or None if missing.
        """

        return self.repository.update_event(event_id, payload)

    def delete_event(self, event_id: str) -> bool:
        """Delete an event by ID.

        Args:
            event_id: Event ID.

        Returns:
            True when deleted, else False.
        """

        return self.repository.delete_event(event_id)
