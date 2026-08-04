"""Tests for Discord webhook client."""

from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest
import requests

from app.discord_client import DiscordWebhookClient
from app.models import Event, EventCategory


def _sample_event() -> Event:
    """Build a reusable sample event."""

    now = datetime.now(timezone.utc)
    return Event(
        id="event-1",
        name="Bandos Night",
        description="Bring your best gear",
        event_datetime=now,
        reward="2M split",
        category=EventCategory.boss,
        created_at=now,
        updated_at=now,
    )


def test_post_event_no_webhook_skips_network() -> None:
    """Ensure no request is made when webhook is not configured."""

    client = DiscordWebhookClient(webhook_url=None)
    with patch("app.discord_client.requests.post") as post_mock:
        client.post_event(_sample_event())
    post_mock.assert_not_called()


def test_post_event_sends_payload() -> None:
    """Ensure event payload is posted successfully."""

    client = DiscordWebhookClient(webhook_url="https://discord.test/webhook")
    response = Mock()
    response.raise_for_status.return_value = None

    with patch("app.discord_client.requests.post", return_value=response) as post_mock:
        client.post_event(_sample_event())

    assert post_mock.call_count == 1
    _, kwargs = post_mock.call_args
    assert "json" in kwargs
    assert "content" in kwargs["json"]


def test_post_event_retries_then_succeeds() -> None:
    """Ensure transient network failure is retried."""

    client = DiscordWebhookClient(webhook_url="https://discord.test/webhook")
    response = Mock()
    response.raise_for_status.return_value = None

    with patch(
        "app.discord_client.requests.post",
        side_effect=[requests.Timeout("timeout"), response],
    ) as post_mock:
        with patch("app.retry.time.sleep"):
            client.post_event(_sample_event())

    assert post_mock.call_count == 2


def test_post_event_raises_after_retries() -> None:
    """Ensure non-recovering failure is propagated."""

    client = DiscordWebhookClient(webhook_url="https://discord.test/webhook")
    with patch(
        "app.discord_client.requests.post",
        side_effect=requests.Timeout("timeout"),
    ):
        with patch("app.retry.time.sleep"):
            with pytest.raises(requests.RequestException):
                client.post_event(_sample_event())
