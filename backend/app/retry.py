"""Retry helpers for API and SDK calls."""

from __future__ import annotations

import logging
import time
from typing import Any, Callable, TypeVar


LOGGER = logging.getLogger(__name__)
T = TypeVar("T")


def with_exponential_backoff(
    func: Callable[[], T],
    retryable_exceptions: tuple[type[BaseException], ...],
    max_attempts: int = 3,
    initial_delay_seconds: float = 0.5,
    backoff_multiplier: float = 2.0,
) -> T:
    """Execute a function with exponential backoff retries.

    Args:
        func: Callable to execute.
        retryable_exceptions: Exception types that trigger retries.
        max_attempts: Maximum attempts before failing.
        initial_delay_seconds: Initial sleep delay between attempts.
        backoff_multiplier: Delay multiplier applied after each retry.

    Returns:
        The callable return value.

    Raises:
        BaseException: Re-raises the final exception after retries are exhausted.
        ValueError: If max_attempts is less than 1.
    """

    if max_attempts < 1:
        raise ValueError("max_attempts must be >= 1")

    delay = initial_delay_seconds
    attempt = 1
    while True:
        try:
            return func()
        except retryable_exceptions as exc:
            LOGGER.warning(
                "Request failed on attempt %s/%s: %s",
                attempt,
                max_attempts,
                exc,
            )
            if attempt >= max_attempts:
                LOGGER.error("Request failed after %s attempts", max_attempts)
                raise
            time.sleep(delay)
            delay *= backoff_multiplier
            attempt += 1
