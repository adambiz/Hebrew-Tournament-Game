const { test, expect } = require('@playwright/test');

const ACTIVE_GAME_STORAGE_KEY = 'hebrewGame_activeGame_v1';

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

async function startRound(page, name) {
  await page.fill('#player-name', name);
  await page.click('#start-button');
  await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
}

async function readState(page) {
  return page.evaluate(() => {
    const gs = window.HebrewGame?.debug?.getGameState?.();
    if (!gs) return null;
    return {
      currentRound: gs.currentRound,
      currentWordIndex: gs.currentWordIndex,
      roundScore: gs.roundScore,
      playerCoins: gs.playerCoins,
      activeWord: gs.activeWord,
      activeLetterIndex: gs.activeLetterIndex,
      typedWord: gs.typedWord || '',
      typedWords: Array.isArray(gs.typedWords) ? gs.typedWords.slice() : null,
      currentWord: gs.currentWord
        ? {
            isPhrase: !!gs.currentWord.isPhrase,
            hebrew: gs.currentWord.hebrew || '',
            words: Array.isArray(gs.currentWord.words) ? gs.currentWord.words.slice() : []
          }
        : null
    };
  });
}

async function typeFewLetters(page, count = 2) {
  const state = await readState(page);
  if (!state || !state.currentWord) throw new Error('No current word');

  const letters = state.currentWord.isPhrase
    ? (state.currentWord.words[0] || '').split('')
    : state.currentWord.hebrew.split('');

  const limit = Math.min(count, letters.length);
  for (let i = 0; i < limit; i++) {
    const letter = letters[i];
    const keyButton = page.getByRole('button', { name: `Hebrew letter ${letter}`, exact: true }).first();
    await expect(keyButton).toBeVisible();
    await keyButton.click();
  }
}

async function expectResumeOverlay(page) {
  await expect(page.locator('#resume-overlay')).toBeVisible();
  await expect(page.locator('#resume-continue')).toBeVisible();
  await expect(page.locator('#resume-restart')).toBeVisible();
}

test.describe('Autosave resume flow', () => {
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

  test('reload keeps prompting until answered and continue restores exact round progress', async ({ page }) => {
    await waitForReady(page);
    await startRound(page, 'Resume Exact State');
    await typeFewLetters(page, 2);

    const beforeReload = await readState(page);
    expect(beforeReload).not.toBeNull();

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expectResumeOverlay(page);

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expectResumeOverlay(page);

    await page.click('#resume-continue');
    await expect(page.locator('#resume-overlay')).toHaveCount(0);
    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);

    const afterContinue = await readState(page);
    expect(afterContinue.currentRound).toBe(beforeReload.currentRound);
    expect(afterContinue.currentWordIndex).toBe(beforeReload.currentWordIndex);
    expect(afterContinue.roundScore).toBe(beforeReload.roundScore);
    expect(afterContinue.playerCoins).toBe(beforeReload.playerCoins);
    expect(afterContinue.activeWord).toBe(beforeReload.activeWord);
    expect(afterContinue.activeLetterIndex).toBe(beforeReload.activeLetterIndex);
    expect(afterContinue.typedWord).toBe(beforeReload.typedWord);
    expect(afterContinue.typedWords).toEqual(beforeReload.typedWords);
  });

  test('restart from resume gate clears autosave and stays cleared after reload', async ({ page }) => {
    await waitForReady(page);
    await startRound(page, 'Restart From Gate');

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expectResumeOverlay(page);

    await page.click('#resume-restart');
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#round-screen')).toHaveClass(/hidden/);

    const storageAfterRestart = await page.evaluate((key) => localStorage.getItem(key), ACTIVE_GAME_STORAGE_KEY);
    expect(storageAfterRestart).toBeNull();

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expect(page.locator('#resume-overlay')).toHaveCount(0);
  });

  test('continue restores round-results and reopens store overlay when it was active', async ({ page }) => {
    await waitForReady(page);
    await startRound(page, 'Results Restore');

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs || !gs.player) return;
      gs.player.score = Math.max(gs.player.score, 999);
      gs.opponents.forEach((opponent, index) => {
        opponent.score = Math.min(opponent.score, index);
      });
      window.HebrewGame?.debug?.forceWinRound?.();
    });

    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);
    await page.click('#visit-store');
    await expect(page.locator('#store-overlay')).toBeVisible();

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expectResumeOverlay(page);

    await page.click('#resume-continue');
    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);
    await expect(page.locator('#store-overlay')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#store-overlay')).toHaveCount(0);
    await expect(page.locator('#next-round')).toBeVisible();
  });

  test('game over clears autosave and tablet recovery modal stays touch-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await waitForReady(page);
    await startRound(page, 'Tablet Modal');

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expectResumeOverlay(page);

    const tabletLayout = await page.evaluate(() => {
      const continueButton = document.getElementById('resume-continue');
      const restartButton = document.getElementById('resume-restart');
      if (!continueButton || !restartButton) {
        return {
          continueInViewport: false,
          restartInViewport: false,
          continueMinHeight: 0,
          restartMinHeight: 0
        };
      }
      const cRect = continueButton.getBoundingClientRect();
      const rRect = restartButton.getBoundingClientRect();
      return {
        continueInViewport: cRect.top >= 0 && cRect.bottom <= window.innerHeight,
        restartInViewport: rRect.top >= 0 && rRect.bottom <= window.innerHeight,
        continueMinHeight: Number.parseFloat(getComputedStyle(continueButton).minHeight) || 0,
        restartMinHeight: Number.parseFloat(getComputedStyle(restartButton).minHeight) || 0
      };
    });

    expect(tabletLayout.continueInViewport).toBe(true);
    expect(tabletLayout.restartInViewport).toBe(true);
    expect(tabletLayout.continueMinHeight).toBeGreaterThanOrEqual(52);
    expect(tabletLayout.restartMinHeight).toBeGreaterThanOrEqual(52);

    await page.click('#resume-continue');
    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return;
      gs.currentRound = gs.maxRounds;
      window.HebrewGame?.ui?.startNextRound?.();
    });
    await expect(page.locator('#game-over')).not.toHaveClass(/hidden/);

    const storageAfterGameOver = await page.evaluate((key) => localStorage.getItem(key), ACTIVE_GAME_STORAGE_KEY);
    expect(storageAfterGameOver).toBeNull();

    await page.click('#play-again');
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);

    const storageAfterPlayAgain = await page.evaluate((key) => localStorage.getItem(key), ACTIVE_GAME_STORAGE_KEY);
    expect(storageAfterPlayAgain).toBeNull();
  });

  test('language change updates recovery modal copy while open', async ({ page }) => {
    await waitForReady(page);
    await startRound(page, 'Language Overlay');

    await page.reload();
    await page.waitForFunction(() => window.HebrewGame?.debug?.getGameState?.()?.dataReady === true, { timeout: 20000 });
    await expectResumeOverlay(page);

    await page.evaluate(() => {
      window.HebrewGame?.i18n?.setLanguage?.('de');
    });
    await expect(page.locator('#resume-title')).toHaveText('Gespeichertes Turnier fortsetzen?');
    await expect(page.locator('#resume-continue')).toHaveText('Fortsetzen');
    await expect(page.locator('#resume-restart')).toHaveText('Neu starten');

    await page.evaluate(() => {
      window.HebrewGame?.i18n?.setLanguage?.('he');
    });
    await expect(page.locator('#resume-continue')).toHaveText('המשך');
    await expect(page.locator('#resume-restart')).toHaveText('התחל מחדש');
  });
});
