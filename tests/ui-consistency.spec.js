const { test, expect } = require('@playwright/test');

const TYPOGRAPHY_SELECTOR = [
  'button',
  'input',
  'textarea',
  'p',
  '.pixel-chip',
  '.badge-title',
  '.badge-subtitle',
  '.badge-value',
  '.power-up-description',
  '.store-item-inventory',
  '.score-name',
  '.score-value',
  '.ranking-name',
  '.ranking-score',
  '.next-round-description',
  '.game-result-copy',
  '.leaderboard-name',
  '.leaderboard-score'
].join(', ');

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

async function startGame(page, playerName = 'UI Consistency') {
  await page.fill('#player-name', playerName);
  await page.click('#start-button');
  await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
}

async function collectTypographyStats(page, rootSelector) {
  return page.evaluate(({ rootSelector, selector }) => {
    const root = document.querySelector(rootSelector);
    if (!root) return { count: 0, min: 0, max: 0, spread: 0 };

    const isVisible = (element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const sizes = Array.from(root.querySelectorAll(selector))
      .filter(isVisible)
      .map((element) => Number.parseFloat(getComputedStyle(element).fontSize))
      .filter((value) => Number.isFinite(value));

    if (!sizes.length) return { count: 0, min: 0, max: 0, spread: 0 };

    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    return {
      count: sizes.length,
      min,
      max,
      spread: max - min
    };
  }, { rootSelector, selector: TYPOGRAPHY_SELECTOR });
}

async function collectButtonHeightStats(page, rootSelector) {
  return page.evaluate((rootSelector) => {
    const root = document.querySelector(rootSelector);
    if (!root) return { count: 0, min: 0, max: 0 };

    const isVisible = (element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const heights = Array.from(root.querySelectorAll('button'))
      .filter(isVisible)
      .map((button) => button.getBoundingClientRect().height)
      .filter((height) => Number.isFinite(height));

    if (!heights.length) return { count: 0, min: 0, max: 0 };
    return {
      count: heights.length,
      min: Math.min(...heights),
      max: Math.max(...heights)
    };
  }, rootSelector);
}

function expectTypographyWithinRange(stats, label) {
  expect(stats.count, `${label}: expected visible text samples`).toBeGreaterThanOrEqual(2);
  expect(stats.min, `${label}: text too small`).toBeGreaterThanOrEqual(12);
  expect(stats.max, `${label}: text too large`).toBeLessThanOrEqual(26);
  expect(stats.spread, `${label}: typography spread too wide`).toBeLessThanOrEqual(11);
}

function expectButtonHeightsWithinRange(stats, label) {
  expect(stats.count, `${label}: expected visible buttons`).toBeGreaterThan(0);
  expect(stats.min, `${label}: button too short`).toBeGreaterThanOrEqual(38);
  expect(stats.max, `${label}: button too tall`).toBeLessThanOrEqual(56);
}

test('keeps button proportions and text scale consistent across main UI surfaces', async ({ page }) => {
  await waitForReady(page);

  expectTypographyWithinRange(await collectTypographyStats(page, '#start-screen'), 'start-screen');
  expectButtonHeightsWithinRange(await collectButtonHeightStats(page, '#start-screen'), 'start-screen');

  await startGame(page);

  expectTypographyWithinRange(await collectTypographyStats(page, '#round-screen'), 'round-screen');
  expectButtonHeightsWithinRange(await collectButtonHeightStats(page, '#round-screen'), 'round-screen');

  await page.evaluate(() => {
    window.HebrewGame?.debug?.forceShowScreen?.('round-results');
  });
  await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);
  expectTypographyWithinRange(await collectTypographyStats(page, '#round-results'), 'round-results');
  expectButtonHeightsWithinRange(await collectButtonHeightStats(page, '#round-results'), 'round-results');

  await page.evaluate(() => {
    const trigger = document.getElementById('visit-store');
    window.HebrewGame?.ui?.openStoreOverlay?.(trigger);
  });
  await expect(page.locator('#store-overlay')).toBeVisible();
  expectTypographyWithinRange(await collectTypographyStats(page, '#store-overlay'), 'store-overlay');
  expectButtonHeightsWithinRange(await collectButtonHeightStats(page, '#store-overlay'), 'store-overlay');

  await page.evaluate(() => {
    window.HebrewGame?.ui?.closeStoreOverlay?.();
    window.HebrewGame?.debug?.forceShowScreen?.('game-over');
  });
  await expect(page.locator('#game-over')).not.toHaveClass(/hidden/);
  expectTypographyWithinRange(await collectTypographyStats(page, '#game-over'), 'game-over');
  expectButtonHeightsWithinRange(await collectButtonHeightStats(page, '#game-over'), 'game-over');
});
