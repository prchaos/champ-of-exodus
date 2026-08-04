"""Tests for event service logic."""

from datetime import datetime, timezone
from unittest.mock import Mock

from app.models import Event, EventCategory, EventCreate, EventUpdate
from app.service import EventService


def _event() -> Event:
    """Build reusable event model."""

    now = datetime.now(timezone.utc)
    return Event(
        id="evt-1",
        name="Clan Wars",
        description="Fight together",
        event_datetime=now,
        reward="Glory",
        category=EventCategory.minigame,
        created_at=now,
        updated_at=now,
    )


def _payload() -> EventCreate:
    """Build reusable create payload."""

    e = _event()
    return EventCreate(
        name=e.name,
        description=e.description,
        event_datetime=e.event_datetime,
        reward=e.reward,
        category=e.category,
    )


def test_create_event_posts_to_discord() -> None:
    """Ensure create flow stores event and posts to Discord."""

    repo = Mock()
    discord = Mock()
    repo.create_event.return_value = _event()

    service = EventService(repository=repo, discord_client=discord)
    result = service.create_event(_payload())

    assert result.id == "evt-1"
    repo.create_event.assert_called_once()
    discord.post_event.assert_called_once()


def test_list_update_delete_passthrough() -> None:
    """Ensure list/update/delete delegate to repository."""

    repo = Mock()
    discord = Mock()

    repo.list_events.return_value = [_event()]
    repo.update_event.return_value = _event()
    repo.delete_event.return_value = True

    service = EventService(repository=repo, discord_client=discord)

    assert len(service.list_events()) == 1
    assert service.update_event("evt-1", EventUpdate(name="new")) is not None
    assert service.delete_event("evt-1") is True
