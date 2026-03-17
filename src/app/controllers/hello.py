"""Hello controller with business logic.

Encapsulates database operations and business rules for Hello resources.
Views call controller methods rather than interacting with models directly.
"""
import typing

from ..models import Hello, db
from ..schemas import HelloCreate


class HelloController:
    """Controller for Hello resource operations."""

    @staticmethod
    def get_all() -> list[Hello]:
        """Retrieve all Hello records.

        Returns:
            List of all Hello model instances
        """
        return typing.cast(list[Hello], Hello.query.order_by(Hello.created_at.desc()).all())

    @staticmethod
    def get_by_id(hello_id: int) -> Hello | None:
        """Retrieve a Hello record by ID.

        Args:
            hello_id: Primary key of the Hello record

        Returns:
            Hello instance if found, None otherwise
        """
        return typing.cast(Hello | None, db.session.get(Hello, hello_id))

    @staticmethod
    def create(data: HelloCreate) -> Hello:
        """Create a new Hello record.

        Args:
            data: Validated HelloCreate schema with message

        Returns:
            Newly created Hello instance
        """
        hello = Hello(message=data.message)
        db.session.add(hello)
        db.session.commit()
        return hello

    @staticmethod
    def delete(hello_id: int) -> bool:
        """Delete a Hello record by ID.

        Args:
            hello_id: Primary key of the Hello record to delete

        Returns:
            True if deleted, False if not found
        """
        hello = db.session.get(Hello, hello_id)
        if hello:
            db.session.delete(hello)
            db.session.commit()
            return True
        return False
