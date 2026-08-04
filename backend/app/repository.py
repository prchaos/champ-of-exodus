"""Firestore and Cloud Storage repository layer."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from google.api_core.exceptions import GoogleAPICallError, NotFound
from google.cloud import firestore, storage

from .models import Event, EventCreate, EventUpdate


LOGGER = logging.getLogger(__name__)


class EventRepository:
    """Repository for event persistence in Firestore."""

    def __init__(self, project_id: str, collection_name: str) -> None:
        """Create repository and bind Firestore collection.

        Args:
            project_id: GCP project ID.
            collection_name: Firestore collection for events.

        Returns:
            None.
        """

        self.client = firestore.Client(project=project_id)
        self.collection = self.client.collection(collection_name)

    @staticmethod
    def _snapshot_to_event(doc: Any) -> Event:
        """Convert Firestore snapshot data into an Event model.

        Args:
            doc: Firestore document snapshot.

        Returns:
            Event model.

        Raises:
            ValueError: If snapshot has no data.
        """

        data = doc.to_dict()
        if data is None:
            raise ValueError("Document snapshot had no data")
        return Event(id=doc.id, **data)

    def create_event(self, payload: EventCreate) -> Event:
        """Create a new event document.

        Args:
            payload: Event creation payload.

        Returns:
            Persisted event with generated ID.

        Raises:
            GoogleAPICallError: If Firestore call fails.
        """

        now = datetime.now(timezone.utc)
        raw_data = payload.model_dump()
        doc_data = {
            **raw_data,
            "event_datetime": raw_data["event_datetime"],
            "created_at": now,
            "updated_at": now,
        }
        LOGGER.info("Firestore create event request initiated")
        doc_ref = self.collection.document()
        doc_ref.set(doc_data)
        LOGGER.info("Firestore create event request successful")
        return Event(id=doc_ref.id, **doc_data)

    def list_events(self) -> list[Event]:
        """List events ordered by event date.

        Args:
            None.

        Returns:
            List of events.

        Raises:
            GoogleAPICallError: If Firestore query fails.
        """

        LOGGER.info("Firestore list events request initiated")
        docs = self.collection.order_by("event_datetime").stream()
        events = [self._snapshot_to_event(doc) for doc in docs]
        LOGGER.info("Firestore list events request successful")
        return events

    def get_event(self, event_id: str) -> Event | None:
        """Retrieve one event by ID.

        Args:
            event_id: Firestore event document ID.

        Returns:
            Event if found, otherwise None.

        Raises:
            GoogleAPICallError: If Firestore read fails.
        """

        doc = self.collection.document(event_id).get()
        if not doc.exists:
            return None
        return self._snapshot_to_event(doc)

    def update_event(self, event_id: str, payload: EventUpdate) -> Event | None:
        """Update an existing event.

        Args:
            event_id: Firestore event document ID.
            payload: Partial update payload.

        Returns:
            Updated event or None when missing.

        Raises:
            GoogleAPICallError: If Firestore update fails.
        """

        doc_ref = self.collection.document(event_id)
        existing = doc_ref.get()
        if not existing.exists:
            return None

        update_data = payload.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        LOGGER.info("Firestore update event request initiated")
        doc_ref.update(update_data)
        LOGGER.info("Firestore update event request successful")
        refreshed = doc_ref.get()
        return self._snapshot_to_event(refreshed)

    def delete_event(self, event_id: str) -> bool:
        """Delete an event by ID.

        Args:
            event_id: Firestore event document ID.

        Returns:
            True if deleted, False if not found.

        Raises:
            GoogleAPICallError: If Firestore delete fails.
        """

        doc_ref = self.collection.document(event_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False
        LOGGER.info("Firestore delete event request initiated")
        doc_ref.delete()
        LOGGER.info("Firestore delete event request successful")
        return True


class StorageRepository:
    """Repository for Cloud Storage operations."""

    def __init__(self, project_id: str, bucket_name: str | None) -> None:
        """Initialize storage repository.

        Args:
            project_id: GCP project ID.
            bucket_name: Target bucket for assets.

        Returns:
            None.
        """

        self.bucket_name = bucket_name
        self.client = storage.Client(project=project_id)

    def upload_forum_asset(self, object_name: str, content: bytes, content_type: str) -> str:
        """Upload bytes to Cloud Storage and return gs:// URI.

        Args:
            object_name: Destination object path.
            content: Raw file content.
            content_type: MIME type for the object.

        Returns:
            GCS URI of the uploaded object.

        Raises:
            ValueError: If bucket name is not configured.
            GoogleAPICallError: If storage upload fails.
            NotFound: If configured bucket does not exist.
        """

        if not self.bucket_name:
            raise ValueError("GCS_BUCKET_NAME is required for uploads")

        LOGGER.info("Cloud Storage upload request initiated")
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(object_name)
        blob.upload_from_string(content, content_type=content_type)
        LOGGER.info("Cloud Storage upload request successful")
        return f"gs://{self.bucket_name}/{object_name}"
