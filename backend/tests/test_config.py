"""Tests for configuration loading."""

import os

import pytest

from app.config import get_env, load_settings


def test_get_env_returns_default_when_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure missing env falls back to default."""

    monkeypatch.delenv("MISSING_KEY", raising=False)
    assert get_env("MISSING_KEY", default="fallback") == "fallback"


def test_get_env_raises_for_required_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure required missing env raises ValueError."""

    monkeypatch.delenv("REQUIRED_KEY", raising=False)
    with pytest.raises(ValueError):
        get_env("REQUIRED_KEY", required=True)


def test_load_settings_reads_expected_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure settings are loaded from environment."""

    monkeypatch.setenv("GCP_PROJECT_ID", "test-project")
    monkeypatch.setenv("FIRESTORE_EVENTS_COLLECTION", "clan_events")
    monkeypatch.setenv("DISCORD_WEBHOOK_URL", "https://discord.test/webhook")
    monkeypatch.setenv("GCS_BUCKET_NAME", "asset-bucket")

    settings = load_settings()

    assert settings.project_id == "test-project"
    assert settings.events_collection == "clan_events"
    assert settings.discord_webhook_url == "https://discord.test/webhook"
    assert settings.storage_bucket_name == "asset-bucket"
