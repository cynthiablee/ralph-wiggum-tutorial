"""Hello model for demonstration purposes.

A simple model that stores greeting messages. Serves as a template
for creating additional models in the application.
"""
from datetime import datetime
from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base


class Hello(Base):
    """Hello model representing a greeting message.

    Attributes:
        id: Primary key
        message: The greeting message text (max 255 chars)
        created_at: Timestamp when the record was created
    """
    __tablename__ = 'hello'

    id: Mapped[int] = mapped_column(primary_key=True)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    def __repr__(self) -> str:
        return f'<Hello {self.id}: {self.message[:20]}...>'
