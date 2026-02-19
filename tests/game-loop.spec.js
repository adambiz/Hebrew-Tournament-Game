const { test, expect } = require('@playwright/test');

const COMMON_HEBREW_LETTERS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
  'ך', 'ם', 'ן', 'ף', 'ץ'
];

function chooseDifferentLetter(expectedLetter) {
  return COMMON_HEBREW_LETTERS.find((letter) => letter !== expectedLetter) || 'א';
}

async function isScreenVisible(page, screenId) {
  return page.evaluate((id) => {
    const screen = document.getElementById(id);
    return !!screen && !screen.classList.contains('hidden');
  }, screenId);
}

async function readState(page) {
  return page.evaluate(() => {
    const gs = window.HebrewGame?.debug?.getGameState?.();
    if (!gs) return null;

    const currentWord = gs.currentWord
      ? {
          isPhrase: !!gs.currentWord.isPhrase,
          hebrew: gs.currentWord.hebrew || '',
          words: Array.isArray(gs.currentWord.words) ? gs.currentWord.words.slice() : []
        }
      : null;

    return {
      currentRound: gs.currentRound,
      currentWordIndex: gs.currentWordIndex,
      roundWordsLength: Array.isArray(gs.roundWords) ? gs.roundWords.length : 0,
      dataReady: !!gs.dataReady,
      playerCoins: gs.playerCoins,
      roundCoinsEarned: gs.roundCoinsEarned,
      currentWord,
      powerUpsActive: {
        secondChanceRound: !!gs.powerUpsActive?.secondChanceRound,
        easierWordCurrentLevel: gs.powerUpsActive?.easierWordCurrentLevel || 0,
        hasOriginalWord: !!gs.powerUpsActive?.originalWord
      }
    };
  });
}

async function clickLetter(page, letter) {
  const keyButton = page.getByRole('button', { name: `Hebrew letter ${letter}`, exact: true }).first();
  await expect(keyButton).toBeVisible();
  await keyButton.click();
}

async function typeCurrentWord(page, options = {}) {
  const { makeMistake = false, replaceExisting = false } = options;
  const state = await readState(page);
  if (!state || !state.currentWord) {
    throw new Error('No active word available to type');
  }

  if (replaceExisting) {
    await page.locator('#hebrew-word-input .letter-container[data-letter-index="0"]').first().click();
  }

  let mistakeApplied = false;
  const typeLetter = async (expectedLetter) => {
    let letterToType = expectedLetter;
    if (makeMistake && !mistakeApplied) {
      letterToType = chooseDifferentLetter(expectedLetter);
      mistakeApplied = true;
    }
    await clickLetter(page, letterToType);
  };

  if (state.currentWord.isPhrase) {
    for (const word of state.currentWord.words) {
      for (const letter of word) {
        await typeLetter(letter);
      }
    }
  } else {
    for (const letter of state.currentWord.hebrew) {
      await typeLetter(letter);
    }
  }

  await expect(page.locator('#submit-word')).toBeEnabled();
}

async function submitWordAndWaitForProgress(page, via = 'button') {
  const before = await readState(page);
  if (!before) throw new Error('Game state not available before submit');

  if (via === 'enter') {
    await page.keyboard.press('Enter');
  } else {
    await page.locator('#submit-word').click({ force: true });
  }

  await page.waitForFunction(
    ({ round, wordIndex }) => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return false;
      const results = document.getElementById('round-results');
      const isRoundResultsVisible = !!results && !results.classList.contains('hidden');
      if (isRoundResultsVisible || gs.currentRound !== round) {
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

async function finishCurrentRound(page) {
  for (let step = 0; step < 12; step++) {
    if (await isScreenVisible(page, 'round-results')) {
      return;
    }

    const state = await readState(page);
    if (!state) throw new Error('Game state unavailable while finishing round');
    if (state.currentWordIndex >= state.roundWordsLength) {
      await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);
      return;
    }

    await typeCurrentWord(page);
    await submitWordAndWaitForProgress(page, state.currentWordIndex % 2 === 0 ? 'button' : 'enter');
  }

  throw new Error('Round did not complete in expected number of steps');
}

test.describe('Tournament game loop', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => {
        const safeDelay = typeof delay === 'number' ? Math.min(delay, 25) : 0;
        return originalSetTimeout(callback, safeDelay, ...args);
      };
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /1\s*gegen\s*95/i })).toBeVisible();
    await page.waitForFunction(() => {
      const state = window.HebrewGame?.debug?.getGameState?.();
      return !!state && state.dataReady === true;
    }, { timeout: 20000 });
    await expect(page.locator('#start-button')).toBeEnabled();
  });

  test('does not start with empty name', async ({ page }) => {
    await page.click('#start-button');

    const state = await readState(page);
    expect(state.currentRound).toBe(0);
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#round-screen')).toHaveClass(/hidden/);
  });

  test('supports game loop, shop purchases, and bonus usage', async ({ page }) => {
    await page.fill('#player-name', 'Playwright Tester');
    await page.click('#start-button');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#current-round')).toHaveText('1');

    await finishCurrentRound(page);
    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);

    const stateAfterRound1 = await readState(page);
    expect(stateAfterRound1.roundCoinsEarned).toBe(5);

    const coinsEarnedText = Number(await page.locator('#coins-earned').innerText());
    const storeCoinsText = Number(await page.locator('#store-coins').innerText());
    expect(coinsEarnedText).toBe(stateAfterRound1.roundCoinsEarned);
    expect(storeCoinsText).toBe(stateAfterRound1.playerCoins);

    await page.click('#visit-store');
    await expect(page.locator('#store-overlay')).toBeVisible();

    const overlayCoinsBefore = Number(await page.locator('#overlay-store-coins').innerText());
    expect(overlayCoinsBefore).toBeGreaterThanOrEqual(4);

    await page.click('#buy-second_chance_round');
    await expect(page.locator('#inventory-second_chance_round')).toHaveText('1');
    await expect(page.locator('#overlay-store-coins')).toHaveText(String(overlayCoinsBefore - 4));

    await page.click('#close-store');
    await page.click('#next-round');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#current-round')).toHaveText('2');

    await page.click('#use-powerup');
    const secondChanceButton = page.locator('.power-up-button[data-power-up-id="second_chance_round"]');
    await expect(secondChanceButton).toBeVisible();
    await secondChanceButton.scrollIntoViewIfNeeded();
    await secondChanceButton.click();

    const stateWithSecondChance = await readState(page);
    expect(stateWithSecondChance.powerUpsActive.secondChanceRound).toBe(true);

    const wordIndexBeforeMistake = stateWithSecondChance.currentWordIndex;
    await typeCurrentWord(page, { makeMistake: true });
    await page.locator('#submit-word').click({ force: true });

    await page.waitForFunction(
      (targetWordIndex) => {
        const gs = window.HebrewGame?.debug?.getGameState?.();
        const submitButton = document.getElementById('submit-word');
        return !!gs && gs.currentWordIndex === targetWordIndex && !!submitButton && !submitButton.disabled;
      },
      wordIndexBeforeMistake,
      { timeout: 20000 }
    );

    const stateAfterMistake = await readState(page);
    expect(stateAfterMistake.currentWordIndex).toBe(wordIndexBeforeMistake);

    await typeCurrentWord(page, { replaceExisting: true });
    await submitWordAndWaitForProgress(page, 'enter');

    const stateAfterRetrySuccess = await readState(page);
    expect(stateAfterRetrySuccess.currentWordIndex).toBeGreaterThan(wordIndexBeforeMistake);

    await finishCurrentRound(page);
    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);

    const stateAfterRound2 = await readState(page);
    expect(stateAfterRound2.playerCoins).toBeGreaterThanOrEqual(2);

    await page.click('#visit-store');
    await expect(page.locator('#store-overlay')).toBeVisible();
    await page.click('#buy-easier_word');
    await expect(page.locator('#inventory-easier_word')).toHaveText('1');
    await page.click('#close-store');

    await page.click('#next-round');
    await expect(page.locator('#current-round')).toHaveText('3');

    await page.click('#use-powerup');
    const easierWordButton = page.locator('.power-up-button[data-power-up-id="easier_word"]');
    await expect(easierWordButton).toBeVisible();
    await easierWordButton.scrollIntoViewIfNeeded();
    await easierWordButton.click();

    const stateAfterEasierWord = await readState(page);
    expect(stateAfterEasierWord.powerUpsActive.hasOriginalWord).toBe(true);
    expect(stateAfterEasierWord.powerUpsActive.easierWordCurrentLevel).toBe(2);

    await typeCurrentWord(page);
    await submitWordAndWaitForProgress(page, 'button');

    const stateAfterRound3Word = await readState(page);
    expect(stateAfterRound3Word.currentWordIndex).toBe(1);
  });
});
