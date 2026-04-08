"""LeaderboardEntry model for Pong game scores.

Stores player scores with difficulty level for the Pong game leaderboard.
Each entry is a raw log — all submissions stored, no deduplication by name.
"""
from datetime import datetime
from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base


class LeaderboardEntry(Base):
    """Leaderboard entry representing a player's Pong game score.

    Attributes:
        id: Primary key
        player_name: Player's display name (max 50 chars)
        score: Player's score in the match
        difficulty: Game difficulty level (easy/medium/hard)
        created_at: Timestamp when the score was submitted
    """
    __tablename__ = 'leaderboard_entries'

    id: Mapped[int] = mapped_column(primary_key=True)
    player_name: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[int] = mapped_column(nullable=False)
    difficulty: Mapped[str] = mapped_column(
        String(20), nullable=False, default='medium'
    )
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    def __repr__(self) -> str:
        return (
            f'<LeaderboardEntry {self.id}: '
            f'{self.player_name} {self.score}pts ({self.difficulty})>'
        )
