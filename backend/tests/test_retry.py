"""Tests for retry helper."""

from __future__ import annotations

from typing import Callable
from unittest.mock import patch

import pytest

from app.retry import with_exponential_backoff


class TemporaryError(RuntimeError):
    """Custom retryable exception for tests."""


def test_retry_returns_without_retries() -> None:
    """Ensure single successful call returns immediately."""

    result = with_exponential_backoff(
        func=lambda: "ok",
        retryable_exceptions=(TemporaryError,),
        max_attempts=3,
    )
    assert result == "ok"


def test_retry_succeeds_after_transient_failures() -> None:
    """Ensure transient failures are retried and eventually succeed."""

    state = {"count": 0}

    def flaky() -> str:
        state["count"] += 1
        if state["count"] < 3:
            raise TemporaryError("temporary")
        return "done"

    with patch("app.retry.time.sleep") as sleep_mock:
        result = with_exponential_backoff(
            func=flaky,
            retryable_exceptions=(TemporaryError,),
            max_attempts=3,
            initial_delay_seconds=0.01,
        )

    assert result == "done"
    assert state["count"] == 3
    assert sleep_mock.call_count == 2


def test_retry_raises_after_max_attempts() -> None:
    """Ensure failure is raised after retry limit."""

    with patch("app.retry.time.sleep"):
        with pytest.raises(TemporaryError):
            with_exponential_backoff(
                func=lambda: (_ for _ in ()).throw(TemporaryError("boom")),
                retryable_exceptions=(TemporaryError,),
                max_attempts=2,
            )


def test_retry_rejects_invalid_attempt_count() -> None:
    """Ensure invalid max_attempts is rejected."""

    with pytest.raises(ValueError):
        with_exponential_backoff(
            func=lambda: "noop",
            retryable_exceptions=(TemporaryError,),
            max_attempts=0,
        )
