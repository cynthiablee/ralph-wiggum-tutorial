"""Leaderboard controller with business logic.

Encapsulates database operations and business rules for leaderboard resources.
Views call controller methods rather than interacting with models directly.
"""
from sqlalchemy import select
from ..models import LeaderboardEntry, db
from ..schemas.leaderboard import LeaderboardCreate


class LeaderboardController:
    """Controller for Leaderboard resource operations."""

    @staticmethod
    def get_top_scores(
        difficulty: str | None = None, limit: int = 10
    ) -> list[LeaderboardEntry]:
        """Retrieve top leaderboard scores, optionally filtered by difficulty.

        Args:
            difficulty: Filter by game difficulty (easy/medium/hard).
                       None returns all difficulties.
            limit: Maximum number of entries to return.

        Returns:
            List of LeaderboardEntry instances ordered by score descending.
        """
        stmt = select(LeaderboardEntry).order_by(
            LeaderboardEntry.score.desc()
        )
        if difficulty is not None:
            stmt = stmt.where(LeaderboardEntry.difficulty == difficulty)
        stmt = stmt.limit(limit)
        return list(db.session.execute(stmt).scalars())

    @staticmethod
    def create_entry(data: LeaderboardCreate) -> LeaderboardEntry:
        """Create a new leaderboard entry.

        Args:
            data: Validated LeaderboardCreate schema with player_name,
                  score, and difficulty.

        Returns:
            Newly created LeaderboardEntry instance.
        """
        entry = LeaderboardEntry(
            player_name=data.player_name,
            score=data.score,
            difficulty=data.difficulty,
        )
        db.session.add(entry)
        db.session.commit()
        return entry
