"""create leaderboard entries table

Revision ID: a1b2c3d4e5f6
Revises: e31396db40b1
Create Date: 2026-04-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'e31396db40b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'leaderboard_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('player_name', sa.String(length=50), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    # Plain column list (no DESC) for SQLite compatibility in tests
    op.create_index(
        'ix_leaderboard_difficulty_score',
        'leaderboard_entries',
        ['difficulty', 'score']
    )


def downgrade() -> None:
    op.drop_index(
        'ix_leaderboard_difficulty_score',
        table_name='leaderboard_entries'
    )
    op.drop_table('leaderboard_entries')
