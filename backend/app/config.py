"""Application configuration utilities."""

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    """Runtime settings loaded from environment variables.

    Attributes:
        project_id: GCP project id used by Google Cloud clients.
        events_collection: Firestore collection for clan events.
        discord_webhook_url: Optional webhook URL for Discord integration.
        storage_bucket_name: Optional Cloud Storage bucket name.
    """

    project_id: str
    events_collection: str
    discord_webhook_url: str | None
    storage_bucket_name: str | None


def get_env(name: str, default: str | None = None, required: bool = False) -> str | None:
    """Read an environment variable with optional requirement validation.

    Args:
        name: Name of the environment variable.
        default: Value returned when variable is absent.
        required: Whether absence should raise an exception.

    Returns:
        The environment variable value or default.

    Raises:
        ValueError: If required is True and the variable is missing.
    """

    value = os.getenv(name, default)
    if required and (value is None or value == ""):
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def load_settings() -> Settings:
    """Load typed settings from environment variables.

    Args:
        None.

    Returns:
        A Settings object.

    Raises:
        ValueError: If required variables are not set.
    """

    return Settings(
        project_id=get_env("GCP_PROJECT_ID", required=True) or "",
        events_collection=get_env("FIRESTORE_EVENTS_COLLECTION", "events") or "events",
        discord_webhook_url=get_env("DISCORD_WEBHOOK_URL"),
        storage_bucket_name=get_env("GCS_BUCKET_NAME"),
    )
