"""Pydantic schemas for Leaderboard model.

Defines request validation and response serialization schemas
for the leaderboard API endpoints. Uses Pydantic v2 idioms:
- Annotated + StringConstraints for player_name to strip whitespace
  before length validation (Field(min_length=1) alone would NOT
  reject whitespace-only names like " ").
- Literal for difficulty to get native enum validation.
"""
from datetime import datetime
from typing import Annotated, Literal
from pydantic import BaseModel, Field, StringConstraints, ConfigDict


class LeaderboardCreate(BaseModel):
    """Schema for submitting a new leaderboard entry.

    Validates incoming request data for POST /api/leaderboard.
    """
    player_name: Annotated[str, StringConstraints(
        strip_whitespace=True, min_length=1, max_length=50
    )]
    score: int = Field(ge=0)
    difficulty: Literal['easy', 'medium', 'hard']


class LeaderboardResponse(BaseModel):
    """Schema for leaderboard entry response serialization.

    Used to serialize LeaderboardEntry model instances for API responses.
    """
    id: int
    player_name: str
    score: int
    difficulty: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
