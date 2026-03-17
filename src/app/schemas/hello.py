"""Pydantic schemas for Hello model.

Defines request validation and response serialization schemas
for the Hello resource API endpoints.
"""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class HelloCreate(BaseModel):
    """Schema for creating a new Hello record.

    Validates incoming request data for POST /api/hello.
    """
    message: str = Field(..., min_length=1, max_length=255, description="Greeting message text")


class HelloResponse(BaseModel):  # type: ignore[misc]
    """Schema for Hello response serialization.

    Used to serialize Hello model instances for API responses.
    """
    id: int
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
