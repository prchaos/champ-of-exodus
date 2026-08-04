"""Discord webhook integration client."""

from __future__ import annotations

import logging
from requests import Response
import requests

from .models import Event
from .retry import with_exponential_backoff


LOGGER = logging.getLogger(__name__)


class DiscordWebhookClient:
    """Client for posting event announcements to Discord."""

    def __init__(self, webhook_url: str | None) -> None:
        """Initialize the webhook client.

        Args:
            webhook_url: Discord webhook URL. If absent, posting is skipped.

        Returns:
            None.
        """

        self.webhook_url = webhook_url

    def post_event(self, event: Event) -> None:
        """Post a newly-created event message to Discord.

        Args:
            event: The event to announce.

        Returns:
            None.

        Raises:
            requests.RequestException: If webhook posting fails after retries.
        """

        if not self.webhook_url:
            LOGGER.info("Discord webhook URL not set; skipping Discord post")
            return

        payload = {
            "content": (
                "New clan event created\n"
                f"Name: {event.name}\n"
                f"When: {event.event_datetime.isoformat()}\n"
                f"Reward: {event.reward}\n"
                f"Category: {event.category.value}\n"
                f"Description: {event.description}"
            )
        }

        def send() -> Response:
            LOGGER.info("Discord webhook request initiated")
            response = requests.post(self.webhook_url, json=payload, timeout=10)
            response.raise_for_status()
            LOGGER.info("Discord webhook request successful")
            return response

        with_exponential_backoff(
            func=send,
            retryable_exceptions=(requests.RequestException,),
            max_attempts=3,
        )
