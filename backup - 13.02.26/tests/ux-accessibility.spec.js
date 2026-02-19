const { test, expect } = require('@playwright/test');

const HEBREW_TO_PHYSICAL_KEY = {
  '/': 'q',
  "'": 'w',
  'ק': 'e',
  'ר': 'r',
  'א': 't',
  'ט': 'y',
  'ו': 'u',
  'ן': 'i',
  'ם': 'o',
  'פ': 'p',
  'ש': 'a',
  'ד': 's',
  'ג': 'd',
  'כ': 'f',
  'ע': 'g',
  'י': 'h',
  'ח': 'j',
  'ל': 'k',
  'ך': 'l',
  'ף': ';',
  ',': "'",
  'ז': 'z',
  'ס': 'x',
  'ב': 'c',
  'ה': 'v',
  'נ': 'b',
  'מ': 'n',
  'צ': 'm',
  'ת': ',',
  'ץ': '.',
  '.': '/'
};

async function dispatchKey(page, key) {
  await page.evaluate((keyValue) => {
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: keyValue,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(keyboardEvent);
  }, key);
}

async function readState(page) {
  return page.evaluate(() => {
    const gs = window.HebrewGame?.debug?.getGameState?.();
    if (!gs) return null;

    return {
      currentRound: gs.currentRound,
      currentWordIndex: gs.currentWordIndex,
      roundWordsLength: Array.isArray(gs.roundWords) ? gs.roundWords.length : 0,
      dataReady: !!gs.dataReady,
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

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

async function startGame(page, name = 'UX Tester') {
  await page.fill('#player-name', name);
  await page.click('#start-button');
  await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
}

async function typeExpectedWordWithClicks(page) {
  const state = await readState(page);
  if (!state || !state.currentWord) throw new Error('No current word for typing');

  const letters = state.currentWord.isPhrase
    ? state.currentWord.words.join('').split('')
    : state.currentWord.hebrew.split('');

  for (const letter of letters) {
    const keyButton = page.getByRole('button', { name: `Hebrew letter ${letter}`, exact: true }).first();
    await expect(keyButton).toBeVisible();
    await keyButton.click();
  }

  await expect(page.locator('#submit-word')).toBeEnabled();
}

async function typeExpectedWordWithKeyboard(page) {
  const state = await readState(page);
  if (!state || !state.currentWord) throw new Error('No current word for keyboard typing');

  const letters = state.currentWord.isPhrase
    ? state.currentWord.words.join('').split('')
    : state.currentWord.hebrew.split('');

  for (const letter of letters) {
    const physical = HEBREW_TO_PHYSICAL_KEY[letter];
    if (!physical) throw new Error(`No physical key mapping for Hebrew letter '${letter}'`);
    await dispatchKey(page, physical);
  }

  await expect(page.locator('#submit-word')).toBeEnabled();
}

async function submitAndWaitForAdvance(page) {
  const before = await readState(page);
  if (!before) throw new Error('No game state before submission');

  await page.keyboard.press('Enter');
  await page.waitForFunction(
    ({ round, wordIndex }) => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return false;
      const results = document.getElementById('round-results');
      const isResults = !!results && !results.classList.contains('hidden');

      if (isResults || gs.currentRound !== round) {
        return true;
      }

      if (gs.currentWordIndex !== wordIndex) {
        const submitButton = document.getElementById('submit-word');
        const phraseReady = gs.currentWord?.isPhrase &&
          Array.isArray(gs.typedWords) &&
          gs.typedWords.every((word) => word.length === 0);
        const singleWordReady = !gs.currentWord?.isPhrase && gs.typedWord === '';

        return !!submitButton &&
          submitButton.disabled === true &&
          gs.activeLetterIndex === 0 &&
          (phraseReady || singleWordReady);
      }

      return false;
    },
    { round: before.currentRound, wordIndex: before.currentWordIndex },
    { timeout: 20000 }
  );
}

async function finishRoundWithClicks(page) {
  for (let step = 0; step < 12; step++) {
    const isResultsScreen = await page.evaluate(() => {
      const screen = document.getElementById('round-results');
      return !!screen && !screen.classList.contains('hidden');
    });
    if (isResultsScreen) return;

    const state = await readState(page);
    if (!state) throw new Error('State unavailable while finishing round');
    if (state.currentWordIndex >= state.roundWordsLength) return;

    await typeExpectedWordWithClicks(page);
    await submitAndWaitForAdvance(page);
  }
  throw new Error('Round did not finish in expected number of steps');
}

async function finishRoundWithKeyboard(page) {
  for (let step = 0; step < 12; step++) {
    const isResultsScreen = await page.evaluate(() => {
      const screen = document.getElementById('round-results');
      return !!screen && !screen.classList.contains('hidden');
    });
    if (isResultsScreen) return;

    const state = await readState(page);
    if (!state) throw new Error('State unavailable while finishing round');
    if (state.currentWordIndex >= state.roundWordsLength) return;

    await typeExpectedWordWithKeyboard(page);
    await submitAndWaitForAdvance(page);
  }
  throw new Error('Round did not finish in expected number of steps');
}

test.describe('UX and accessibility flows', () => {
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

  test('mobile flow keeps core actions visible and usable', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await waitForReady(page);
    await startGame(page, 'Mobile Hero');

    await expect(page.locator('#mobile-action-bar')).toBeVisible();
    await expect(page.locator('#submit-word')).toBeVisible();
    await expect(page.locator('#use-powerup')).toBeVisible();

    const actionBarPosition = await page.locator('#mobile-action-bar').evaluate(
      (el) => getComputedStyle(el).position
    );
    expect(actionBarPosition).toBe('sticky');

    await finishRoundWithClicks(page);
    const gameOverVisible = await page.evaluate(() => {
      const screen = document.getElementById('game-over');
      return !!screen && !screen.classList.contains('hidden');
    });

    if (gameOverVisible) {
      await expect(page.locator('#game-over')).not.toHaveClass(/hidden/);
      await expect(page.locator('#visit-store')).not.toBeVisible();
      await expect(page.locator('#final-comparison-section')).toHaveClass(/hidden/);
    } else {
      await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);

      await page.click('#visit-store');
      await expect(page.locator('#store-overlay')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#store-overlay')).toHaveCount(0);

      const nextRoundButton = page.locator('#next-round');
      await expect(nextRoundButton).toBeEnabled();
      await nextRoundButton.click();
      await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
      await expect(page.locator('#current-round')).toHaveText('2');
    }
  });

  test('keyboard-only flow can start, play, and submit', async ({ page }) => {
    await waitForReady(page);

    await page.focus('#player-name');
    await page.keyboard.type('Keyboard Hero');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);

    await finishRoundWithKeyboard(page);
    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);

    await page.locator('#visit-store').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#store-overlay')).toBeVisible();
  });

  test('store overlay supports dialog semantics and focus restore', async ({ page }) => {
    await waitForReady(page);
    await startGame(page, 'Focus Hero');
    await finishRoundWithClicks(page);

    const visitStoreButton = page.locator('#visit-store');
    await visitStoreButton.focus();
    await visitStoreButton.click();

    const overlay = page.locator('#store-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator('#store-overlay')).toHaveCount(0);

    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    expect(activeId).toBe('visit-store');
  });
});
