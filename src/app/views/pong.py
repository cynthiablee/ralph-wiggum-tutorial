"""Pong game views (routes).

Provides the Pong page with pre-loaded leaderboard data and
JSON API endpoints for leaderboard CRUD operations. The page
uses the React Islands pattern — Flask serves HTML with a
data-island="pong" mount point that React hydrates on the client.
"""
from flask import Blueprint, render_template, jsonify, request
from pydantic import ValidationError
from ..controllers.leaderboard import LeaderboardController
from ..schemas.leaderboard import LeaderboardCreate, LeaderboardResponse

pong_bp = Blueprint('pong', __name__)


@pong_bp.route('/pong')
def index():  # type: ignore[no-untyped-def]
    """Render the Pong game page with pre-loaded leaderboard data.

    Queries top 10 entries per difficulty (3 queries, up to 30 total)
    so each leaderboard tab has data on first render without an
    additional client-side fetch.
    """
    all_entries: list[dict[str, object]] = []
    for difficulty in ('easy', 'medium', 'hard'):
        entries = LeaderboardController.get_top_scores(
            difficulty=difficulty, limit=10
        )
        all_entries.extend(
            LeaderboardResponse.model_validate(e).model_dump()
            for e in entries
        )
    return render_template('pong/index.html', leaderboard=all_entries)


@pong_bp.route('/api/leaderboard', methods=['GET'])
def api_list():  # type: ignore[no-untyped-def]
    """Get leaderboard entries as JSON.

    Query parameters:
        difficulty (str, optional): Filter by difficulty level.
        limit (int, optional): Maximum entries to return (default 10).

    Returns:
        JSON array of LeaderboardResponse objects ordered by score desc.
    """
    difficulty = request.args.get('difficulty')
    try:
        limit = int(request.args.get('limit', '10'))
    except ValueError:
        limit = 10

    entries = LeaderboardController.get_top_scores(
        difficulty=difficulty, limit=limit
    )
    return jsonify([
        LeaderboardResponse.model_validate(e).model_dump()
        for e in entries
    ])


@pong_bp.route('/api/leaderboard', methods=['POST'])
def api_create():  # type: ignore[no-untyped-def]
    """Create a new leaderboard entry.

    Request body:
        {"player_name": "...", "score": N, "difficulty": "easy|medium|hard"}

    Returns:
        201: Created LeaderboardResponse object
        400: Validation error with details
    """
    try:
        data = LeaderboardCreate.model_validate(request.json)
    except ValidationError as e:
        return jsonify(error="Validation Error", details=e.errors()), 400

    entry = LeaderboardController.create_entry(data)
    return jsonify(
        LeaderboardResponse.model_validate(entry).model_dump()
    ), 201
