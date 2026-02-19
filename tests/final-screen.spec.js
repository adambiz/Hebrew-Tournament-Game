const { test, expect } = require('@playwright/test');

function parseNumber(textValue) {
  const digits = String(textValue ?? '').replace(/[^\d-]/g, '');
  return digits ? Number(digits) : 0;
}

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

async function clearHighScores(page) {
  await page.evaluate(() => {
    if (window.HebrewGame?.debug?.clearHighScores) {
      window.HebrewGame.debug.clearHighScores();
    }
  });
}

async function startGame(page, name) {
  await page.fill('#player-name', name);
  await page.click('#start-button');
  await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
}

async function forceTournamentFinish(page) {
  await page.evaluate(() => {
    const gs = window.HebrewGame?.debug?.getGameState?.();
    if (!gs) return;
    gs.currentRound = gs.maxRounds;
    window.HebrewGame?.ui?.startNextRound?.();
  });
  await expect(page.locator('#game-over')).not.toHaveClass(/hidden/);
}

async function waitForFinalTotal(page, expectedValue) {
  await page.waitForFunction((expected) => {
    const el = document.getElementById('final-total-score');
    if (!el) return false;
    const value = Number((el.textContent || '').replace(/[^\d-]/g, ''));
    return value === expected;
  }, expectedValue, { timeout: 20000 });
}

test.describe('Final screen and high score persistence', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => {
        const safeDelay = typeof delay === 'number' ? Math.min(delay, 25) : 0;
        return originalSetTimeout(callback, safeDelay, ...args);
      };
    });
  });

  test('persists high scores across reload', async ({ page }) => {
    const playerName = 'Persist Hero';

    await waitForReady(page);
    await clearHighScores(page);
    await startGame(page, playerName);

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return;
      gs.player.score = 25;
      gs.playerCoins = 5;
      gs.opponents.forEach((opponent, index) => {
        opponent.score = Math.max(0, 20 - index);
      });
    });

    await forceTournamentFinish(page);
    await waitForFinalTotal(page, 35);

    await page.reload();
    await waitForReady(page);

    await expect(page.locator('#high-scores-list')).toContainText(playerName);
    await expect(page.locator('#high-scores-list')).toContainText('35');
    await expect(page.locator('#high-scores-list .score-rank-chip')).toHaveCount(0);
    expect(await page.locator('#high-scores-list .hero-avatar-high-score').count()).toBeGreaterThan(0);
  });

  test('applies unused coin bonus to final score and leaderboard', async ({ page }) => {
    const playerName = 'Coin Bonus Hero';

    await waitForReady(page);
    await clearHighScores(page);
    await startGame(page, playerName);

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return;
      gs.player.score = 42;
      gs.playerCoins = 7;
      gs.opponents.forEach((opponent, index) => {
        opponent.score = Math.max(0, 30 - index);
      });
    });

    await forceTournamentFinish(page);
    await waitForFinalTotal(page, 56);

    const baseScore = parseNumber(await page.locator('#final-base-score').innerText());
    const coinBonus = parseNumber(await page.locator('#final-coin-bonus').innerText());
    const finalTotal = parseNumber(await page.locator('#final-total-score').innerText());
    expect(baseScore).toBe(42);
    expect(coinBonus).toBe(14);
    expect(finalTotal).toBe(56);

    await expect(page.locator('#final-high-scores-list')).toContainText(playerName);
    await expect(page.locator('#final-high-scores-list')).toContainText('56');
    await expect(page.locator('#final-high-scores-list .leaderboard-rank')).toHaveCount(0);
    expect(await page.locator('#final-high-scores-list .hero-avatar-leaderboard').count()).toBeGreaterThan(0);
  });

  test('routes elimination directly to final screen without store flow', async ({ page }) => {
    await waitForReady(page);
    await clearHighScores(page);
    await startGame(page, 'Elimination Path Hero');

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return;
      gs.player.score = 0;
      gs.playerCoins = 3;
      gs.roundScore = 0;
      gs.opponents.forEach((opponent, index) => {
        opponent.eliminated = false;
        opponent.score = 200 - index;
      });
      window.completeRound();
    });

    await expect(page.locator('#game-over')).not.toHaveClass(/hidden/);
    await expect(page.locator('#round-results')).toHaveClass(/hidden/);
    await expect(page.locator('#visit-store')).not.toBeVisible();
    await expect(page.locator('#store-overlay')).toHaveCount(0);
    await expect(page.locator('#final-comparison-section')).toHaveClass(/hidden/);
  });

  test('shows finalists-only comparison when player wins', async ({ page }) => {
    const playerName = 'Finalist Hero';
    let finalistA = '';
    let finalistB = '';
    let eliminatedName = '';

    await waitForReady(page);
    await clearHighScores(page);
    await startGame(page, playerName);

    const names = await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return null;

      gs.player.score = 200;
      gs.playerCoins = 2;
      gs.player.eliminated = false;

      gs.opponents.forEach((opponent, index) => {
        if (index < 2) {
          opponent.eliminated = false;
          opponent.score = index === 0 ? 180 : 170;
        } else {
          opponent.eliminated = true;
          opponent.score = 140 - index;
        }
      });

      return {
        finalistA: gs.opponents[0].name,
        finalistB: gs.opponents[1].name,
        eliminatedName: gs.opponents[2].name
      };
    });

    finalistA = names.finalistA;
    finalistB = names.finalistB;
    eliminatedName = names.eliminatedName;

    await forceTournamentFinish(page);
    await waitForFinalTotal(page, 204);

    await expect(page.locator('#final-comparison-section')).not.toHaveClass(/hidden/);
    await expect(page.locator('#final-comparison-list .final-comparison-item')).toHaveCount(3);
    await expect(page.locator('#final-comparison-list')).toContainText(`${playerName} (You)`);
    await expect(page.locator('#final-comparison-list')).toContainText(finalistA);
    await expect(page.locator('#final-comparison-list')).toContainText(finalistB);
    await expect(page.locator('#final-comparison-list')).not.toContainText(eliminatedName);
  });
});
