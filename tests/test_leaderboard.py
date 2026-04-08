"""Tests for Pong leaderboard routes and functionality.

Tests the Pong page rendering and the leaderboard JSON API endpoints.
Covers validation edge cases: whitespace-only names, invalid difficulty,
negative scores, filtering, ordering, and pagination limits.
"""
import json
from typing import Any


class TestLeaderboardPage:
    """Tests for the Pong HTML page."""

    def test_pong_page_returns_html(self, client: Any) -> None:
        """GET /pong should return HTML page with 200 status."""
        response = client.get('/pong')
        assert response.status_code == 200
        assert b'Pong' in response.data

    def test_pong_page_contains_island_mount(self, client: Any) -> None:
        """Pong page should contain React island mount point."""
        response = client.get('/pong')
        assert b'data-island="pong"' in response.data


class TestLeaderboardAPI:
    """Tests for the Leaderboard JSON API."""

    def test_list_empty(self, client: Any) -> None:
        """GET /api/leaderboard should return empty list initially."""
        response = client.get('/api/leaderboard')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == []

    def test_create_entry(self, client: Any) -> None:
        """POST /api/leaderboard should create a new entry."""
        response = client.post(
            '/api/leaderboard',
            json={
                'player_name': 'Alice',
                'score': 5,
                'difficulty': 'medium',
            },
            content_type='application/json',
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['player_name'] == 'Alice'
        assert data['score'] == 5
        assert data['difficulty'] == 'medium'
        assert 'id' in data
        assert 'created_at' in data

    def test_create_entry_invalid_difficulty(self, client: Any) -> None:
        """POST with invalid difficulty should return 400."""
        response = client.post(
            '/api/leaderboard',
            json={
                'player_name': 'Bob',
                'score': 3,
                'difficulty': 'extreme',
            },
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_entry_missing_name(self, client: Any) -> None:
        """POST without player_name should return 400."""
        response = client.post(
            '/api/leaderboard',
            json={'score': 3, 'difficulty': 'easy'},
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_entry_whitespace_name(self, client: Any) -> None:
        """POST with whitespace-only name should return 400.

        StringConstraints(strip_whitespace=True, min_length=1) strips
        the spaces first, then rejects because the result is empty.
        """
        response = client.post(
            '/api/leaderboard',
            json={
                'player_name': '   ',
                'score': 3,
                'difficulty': 'easy',
            },
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_entry_negative_score(self, client: Any) -> None:
        """POST with negative score should return 400."""
        response = client.post(
            '/api/leaderboard',
            json={
                'player_name': 'Eve',
                'score': -1,
                'difficulty': 'hard',
            },
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_create_entry_zero_score(self, client: Any) -> None:
        """POST with score=0 should be accepted (ge=0)."""
        response = client.post(
            '/api/leaderboard',
            json={
                'player_name': 'Zero',
                'score': 0,
                'difficulty': 'easy',
            },
            content_type='application/json',
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['score'] == 0

    def test_list_after_create(self, client: Any) -> None:
        """GET should return entries ordered by score descending."""
        client.post(
            '/api/leaderboard',
            json={
                'player_name': 'Low',
                'score': 2,
                'difficulty': 'medium',
            },
            content_type='application/json',
        )
        client.post(
            '/api/leaderboard',
            json={
                'player_name': 'High',
                'score': 5,
                'difficulty': 'medium',
            },
            content_type='application/json',
        )

        response = client.get('/api/leaderboard')
        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]['player_name'] == 'High'
        assert data[1]['player_name'] == 'Low'

    def test_list_filter_by_difficulty(self, client: Any) -> None:
        """GET with ?difficulty=easy should filter results."""
        client.post(
            '/api/leaderboard',
            json={
                'player_name': 'EasyP',
                'score': 3,
                'difficulty': 'easy',
            },
            content_type='application/json',
        )
        client.post(
            '/api/leaderboard',
            json={
                'player_name': 'HardP',
                'score': 4,
                'difficulty': 'hard',
            },
            content_type='application/json',
        )

        response = client.get('/api/leaderboard?difficulty=easy')
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['player_name'] == 'EasyP'

    def test_list_limit(self, client: Any) -> None:
        """GET with ?limit=10 should return at most 10 entries."""
        for i in range(15):
            client.post(
                '/api/leaderboard',
                json={
                    'player_name': f'Player{i}',
                    'score': i,
                    'difficulty': 'medium',
                },
                content_type='application/json',
            )

        response = client.get('/api/leaderboard?limit=10')
        data = json.loads(response.data)
        assert len(data) == 10
