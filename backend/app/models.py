"""Data models used by the API and integrations."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class EventCategory(str, Enum):
    """Supported event categories."""

    skill = "skill"
    boss = "boss"
    minigame = "minigame"


class EventBase(BaseModel):
    """Shared event fields."""

    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=5000)
    event_datetime: datetime
    reward: str = Field(min_length=1, max_length=500)
    category: EventCategory


class EventCreate(EventBase):
    """Payload for creating events."""


class EventUpdate(BaseModel):
    """Payload for updating events."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    event_datetime: datetime | None = None
    reward: str | None = Field(default=None, min_length=1, max_length=500)
    category: EventCategory | None = None


class Event(EventBase):
    """Stored event representation."""

    id: str
    created_at: datetime
    updated_at: datetime
