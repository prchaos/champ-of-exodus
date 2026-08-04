"""Tests for Firestore and Storage repositories."""

from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest

from app.models import EventCategory, EventCreate, EventUpdate
from app.repository import EventRepository, StorageRepository


def _event_payload() -> EventCreate:
    """Create reusable event payload."""

    return EventCreate(
        name="Skilling Sunday",
        description="Train together",
        event_datetime=datetime.now(timezone.utc),
        reward="500k",
        category=EventCategory.skill,
    )


@patch("app.repository.firestore.Client")
def test_create_event(mock_client: Mock) -> None:
    """Ensure create_event writes to Firestore and returns event."""

    doc_ref = Mock()
    doc_ref.id = "abc123"
    collection = Mock()
    collection.document.return_value = doc_ref
    mock_client.return_value.collection.return_value = collection

    repo = EventRepository(project_id="proj", collection_name="events")
    event = repo.create_event(_event_payload())

    assert event.id == "abc123"
    assert collection.document.called
    assert doc_ref.set.called


@patch("app.repository.firestore.Client")
def test_list_events(mock_client: Mock) -> None:
    """Ensure list_events maps snapshots to models."""

    now = datetime.now(timezone.utc)
    snapshot = Mock()
    snapshot.id = "evt1"
    snapshot.to_dict.return_value = {
        "name": "Boss Rush",
        "description": "Let's go",
        "event_datetime": now,
        "reward": "1M",
        "category": EventCategory.boss,
        "created_at": now,
        "updated_at": now,
    }

    collection = Mock()
    collection.order_by.return_value.stream.return_value = [snapshot]
    mock_client.return_value.collection.return_value = collection

    repo = EventRepository(project_id="proj", collection_name="events")
    events = repo.list_events()

    assert len(events) == 1
    assert events[0].id == "evt1"


@patch("app.repository.firestore.Client")
def test_get_event_missing_returns_none(mock_client: Mock) -> None:
    """Ensure get_event returns None for missing documents."""

    missing_doc = Mock()
    missing_doc.exists = False

    collection = Mock()
    collection.document.return_value.get.return_value = missing_doc
    mock_client.return_value.collection.return_value = collection

    repo = EventRepository(project_id="proj", collection_name="events")
    event = repo.get_event("missing")

    assert event is None


@patch("app.repository.firestore.Client")
def test_update_event_missing_returns_none(mock_client: Mock) -> None:
    """Ensure update_event returns None when event is absent."""

    missing_doc = Mock()
    missing_doc.exists = False

    doc_ref = Mock()
    doc_ref.get.return_value = missing_doc

    collection = Mock()
    collection.document.return_value = doc_ref
    mock_client.return_value.collection.return_value = collection

    repo = EventRepository(project_id="proj", collection_name="events")
    event = repo.update_event("missing", EventUpdate(name="new"))

    assert event is None


@patch("app.repository.firestore.Client")
def test_update_event_success(mock_client: Mock) -> None:
    """Ensure update_event writes and returns refreshed model."""

    now = datetime.now(timezone.utc)

    existing_doc = Mock()
    existing_doc.exists = True

    refreshed_doc = Mock()
    refreshed_doc.id = "evt1"
    refreshed_doc.to_dict.return_value = {
        "name": "Updated",
        "description": "Desc",
        "event_datetime": now,
        "reward": "2M",
        "category": EventCategory.minigame,
        "created_at": now,
        "updated_at": now,
    }

    doc_ref = Mock()
    doc_ref.get.side_effect = [existing_doc, refreshed_doc]

    collection = Mock()
    collection.document.return_value = doc_ref
    mock_client.return_value.collection.return_value = collection

    repo = EventRepository(project_id="proj", collection_name="events")
    event = repo.update_event("evt1", EventUpdate(name="Updated"))

    assert event is not None
    assert event.id == "evt1"
    assert doc_ref.update.called


@patch("app.repository.firestore.Client")
def test_delete_event_paths(mock_client: Mock) -> None:
    """Ensure delete_event handles missing and existing records."""

    missing_doc = Mock()
    missing_doc.exists = False

    existing_doc = Mock()
    existing_doc.exists = True

    doc_ref = Mock()
    doc_ref.get.side_effect = [missing_doc, existing_doc]

    collection = Mock()
    collection.document.return_value = doc_ref
    mock_client.return_value.collection.return_value = collection

    repo = EventRepository(project_id="proj", collection_name="events")

    assert repo.delete_event("a") is False
    assert repo.delete_event("b") is True
    assert doc_ref.delete.call_count == 1


@patch("app.repository.storage.Client")
def test_upload_forum_asset_success(mock_storage_client: Mock) -> None:
    """Ensure forum assets are uploaded to configured bucket."""

    blob = Mock()
    bucket = Mock()
    bucket.blob.return_value = blob

    storage_client = Mock()
    storage_client.bucket.return_value = bucket
    mock_storage_client.return_value = storage_client

    repo = StorageRepository(project_id="proj", bucket_name="bucket-a")
    uri = repo.upload_forum_asset("boards/welcome.txt", b"hello", "text/plain")

    assert uri == "gs://bucket-a/boards/welcome.txt"
    assert blob.upload_from_string.called


@patch("app.repository.storage.Client")
def test_upload_forum_asset_requires_bucket(mock_storage_client: Mock) -> None:
    """Ensure upload fails fast without configured bucket."""

    repo = StorageRepository(project_id="proj", bucket_name=None)
    with pytest.raises(ValueError):
        repo.upload_forum_asset("x", b"y", "text/plain")
