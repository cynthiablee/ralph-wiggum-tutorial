import { test, expect } from '@playwright/test';

test.describe('Pong Page', () => {
  test('loads the pong page and shows the game area', async ({ page }) => {
    await page.goto('/pong');
    const island = page.locator('[data-island="pong"]');
    await expect(island).toBeVisible();
    // Should show difficulty selection screen initially
    await expect(page.getByText('Ready to Play?')).toBeVisible();
  });

  test('difficulty selector is visible with three options', async ({ page }) => {
    await page.goto('/pong');
    await expect(page.getByRole('button', { name: /easy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /medium/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hard/i })).toBeVisible();
  });

  test('leaderboard panel is visible on page load', async ({ page }) => {
    await page.goto('/pong');
    await expect(page.getByText('Leaderboard')).toBeVisible();
  });

  test('can start a game by selecting difficulty', async ({ page }) => {
    await page.goto('/pong');
    await page.getByRole('button', { name: /easy/i }).click();
    // After clicking, the canvas should appear
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Leaderboard API', () => {
  test('can submit a score via API and it appears in leaderboard', async ({ page, request }) => {
    // POST a score directly
    const response = await request.post('/api/leaderboard', {
      data: {
        player_name: 'E2E Tester',
        score: 5,
        difficulty: 'medium',
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.player_name).toBe('E2E Tester');

    // Navigate to pong page and check leaderboard
    await page.goto('/pong');
    await expect(page.getByText('E2E Tester')).toBeVisible();
  });

  test('POST /api/leaderboard rejects invalid data', async ({ request }) => {
    // Missing player_name
    const response = await request.post('/api/leaderboard', {
      data: {
        score: 3,
        difficulty: 'easy',
      },
    });
    expect(response.status()).toBe(400);
  });
});
